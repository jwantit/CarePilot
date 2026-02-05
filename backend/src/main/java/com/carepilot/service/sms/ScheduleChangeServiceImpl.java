package com.carepilot.service.sms;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.OutboundSms;
import com.carepilot.domain.sms.SentBy;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.sms.OutboundSmsRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.service.call.TwilioService;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Log4j2
public class ScheduleChangeServiceImpl implements ScheduleChangeService {

    /** 주기 변경 요청 키워드: 이 중 하나라도 포함되면 scheduled_time + next_run_at 모두 변경 */
    private static final Pattern RECURRING_CHANGE_PATTERN = Pattern.compile(
            "앞으로|모두|이제부터|마다|매주|매일|매월|매번|항상|계속");

    private static final String DATE_EXTRACT_PROMPT = """
            사용자가 보낸 문자에서 예약 변경을 요청한 날짜와 시각을 추출하세요.
            현재 시각: %s (오늘 요일: %s)

            규칙:
            0. 시각만 있는 경우(예: "5시로 변경해", "3시", "오후 2시"): 오늘 날짜 + 해당 시각. "오전 5시"=05:00, "오후 5시"=17:00. 오전/오후 없으면 예약 맥락상 오후로 해석(5시→17:00, 3시→15:00).
            1. 요청한 요일이 "오늘"과 같고, 해당 시각이 아직 안 지났으면 → 오늘 날짜 + 그 시각.
            2. 요청한 요일이 오늘과 같지만 해당 시각이 이미 지났으면 → 다음 주 같은 요일 + 그 시각.
            3. 요청한 요일이 오늘보다 "이번 주에서 나중"이면 → 이번 주 그 요일 + 시각.
            4. 요청한 요일이 오늘보다 "이번 주에서 이미 지남"이면 → 다음 주 그 요일 + 시각.
            5. 구체적 날짜가 있으면 그대로 YYYY-MM-DD HH:mm으로 출력.

            반드시 위 규칙으로 "한 번"의 날짜만 출력하세요. 형식은 반드시 YYYY-MM-DD HH:mm (예: 2026-02-02 17:00).

            응답: 반드시 이 형식만 출력 (다른 글자 없음): YYYY-MM-DD HH:mm
            추출할 수 없으면 정확히: UNKNOWN
            """;

    private final CallScheduleRepository callScheduleRepository;
    private final ScheduleNotificationService scheduleNotificationService;
    private final TwilioService twilioService;
    private final OutboundSmsRepository outboundSmsRepository;
    private final TaskRepository taskRepository;

    private final ChatClient chatClient;

    public ScheduleChangeServiceImpl(
            CallScheduleRepository callScheduleRepository,
            ScheduleNotificationService scheduleNotificationService,
            TwilioService twilioService,
            OutboundSmsRepository outboundSmsRepository,
            TaskRepository taskRepository,
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.callScheduleRepository = callScheduleRepository;
        this.scheduleNotificationService = scheduleNotificationService;
        this.twilioService = twilioService;
        this.outboundSmsRepository = outboundSmsRepository;
        this.taskRepository = taskRepository;
        this.chatClient = chatClient;
    }

    @Override
    @Transactional
    public void processScheduleChange(InboundSms inboundSms) {
        if (inboundSms == null || inboundSms.getSmsType() != SmsType.SCHEDULE_CHANGE) {
            return;
        }
        CareTarget careTarget = inboundSms.getCareTarget();
        if (careTarget == null) {
            log.info("[ScheduleChange] CareTarget 없음 inboundSmsId={}", inboundSms.getInboundSmsId());
            return;
        }

        // 개인 스케줄만 대상 (그룹 스케줄 변경은 TODO 보류)
        List<CallSchedule> schedules = callScheduleRepository.findIndividualSchedulesByCareTargetAndStatus(
                careTarget, ScheduleStatus.SCHEDULED);
        if (schedules.isEmpty()) {
            log.info("[ScheduleChange] SCHEDULED 개인 예약 없음 careTargetId={}", careTarget.getCareTargetId());
            saveFailedTask(careTarget, null, "SCHEDULED 개인 예약 없음");
            return;
        }

        // 가장 가까운 예약
        CallSchedule nearest = schedules.get(0);

        // 그룹 스케줄 체크 (혹시 모를 방어)
        if (nearest.getTargetType() == ScheduleTargetType.GROUP || nearest.getGroup() != null) {
            log.info("[ScheduleChange] 그룹 스케줄 변경 요청은 미지원(보류) scheduleId={}", nearest.getScheduleId());
            saveFailedTask(careTarget, nearest, "그룹 스케줄 변경 미지원");
            return;
        }

        // Task 생성 (AI 처리 내역용, WAITING)
        String bodyPreview = inboundSms.getBody();
        if (bodyPreview != null && bodyPreview.length() > 50) {
            bodyPreview = bodyPreview.substring(0, 50) + "...";
        }
        Task task = saveTask(careTarget, nearest, TaskStatus.WAITING,
                "예약 변경 문자 처리 시작: " + (bodyPreview != null ? bodyPreview : ""), null);

        try {
            // LLM으로 날짜 추출
            LocalDateTime newDateTime = extractDateTimeFromBody(inboundSms.getBody());
            if (newDateTime == null) {
                log.warn("[ScheduleChange] 날짜 파싱 실패 inboundSmsId={}, body={}", inboundSms.getInboundSmsId(), inboundSms.getBody());
                updateTaskStatus(task, TaskStatus.FAILED, "날짜/시각 파싱 실패");
                return;
            }

            // 단발 변경(기본): next_run_at만 변경. 주기 변경: scheduled_time + next_run_at 모두 변경
            boolean recurringChange = isRecurringChangeRequest(inboundSms.getBody());
            if (recurringChange) {
                nearest.applyUpdates(careTarget, null, newDateTime, null, null, null, null, null);
                nearest.rescheduleNextRunAt(newDateTime);
                log.info("[ScheduleChange] 주기 변경 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
            } else {
                nearest.applyUpdates(careTarget, null, null, null, null, null, null, null);
                nearest.rescheduleNextRunAt(newDateTime);
                log.info("[ScheduleChange] 단발 변경 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
            }
            callScheduleRepository.save(nearest);

            // 변경 확인 문자 발송
            sendChangeConfirmationSms(careTarget, nearest);

            String resultMsg = String.format("예약 변경 완료: %d월 %d일 %d시 %02d분으로 변경", 
                    newDateTime.getMonthValue(), newDateTime.getDayOfMonth(), newDateTime.getHour(), newDateTime.getMinute());
            task.updateSchedule(nearest);
            updateTaskStatus(task, TaskStatus.SUCCESS, resultMsg);

            log.info("[ScheduleChange] 예약 변경 완료 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
        } catch (Exception e) {
            log.error("[ScheduleChange] 예약 변경 처리 실패: {}", e.getMessage(), e);
            updateTaskStatus(task, TaskStatus.FAILED, "예약 변경 실패: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void processScheduleChangeWithExistingTask(InboundSms inboundSms, Task existingTask) {
        if (inboundSms == null || inboundSms.getSmsType() != SmsType.SCHEDULE_CHANGE || existingTask == null) {
            return;
        }
        CareTarget careTarget = inboundSms.getCareTarget();
        if (careTarget == null) {
            updateTaskStatus(existingTask, TaskStatus.FAILED, "CareTarget 없음");
            return;
        }

        existingTask.changeStatus(TaskStatus.PROGRESS);
        taskRepository.save(existingTask);

        List<CallSchedule> schedules = callScheduleRepository.findIndividualSchedulesByCareTargetAndStatus(
                careTarget, ScheduleStatus.SCHEDULED);
        if (schedules.isEmpty()) {
            updateTaskStatus(existingTask, TaskStatus.FAILED, "SCHEDULED 개인 예약 없음");
            return;
        }

        CallSchedule nearest = schedules.get(0);
        if (nearest.getTargetType() == ScheduleTargetType.GROUP || nearest.getGroup() != null) {
            updateTaskStatus(existingTask, TaskStatus.FAILED, "그룹 스케줄 변경 미지원");
            return;
        }

        try {
            LocalDateTime newDateTime = extractDateTimeFromBody(inboundSms.getBody());
            if (newDateTime == null) {
                updateTaskStatus(existingTask, TaskStatus.FAILED, "날짜/시각 파싱 실패");
                return;
            }

            boolean recurringChange = isRecurringChangeRequest(inboundSms.getBody());
            if (recurringChange) {
                nearest.applyUpdates(careTarget, null, newDateTime, null, null, null, null, null);
                nearest.rescheduleNextRunAt(newDateTime);
            } else {
                nearest.applyUpdates(careTarget, null, null, null, null, null, null, null);
                nearest.rescheduleNextRunAt(newDateTime);
            }
            callScheduleRepository.save(nearest);
            sendChangeConfirmationSms(careTarget, nearest);

            String resultMsg = String.format("AI 자동 처리 완료: %d월 %d일 %d시 %02d분으로 변경",
                    newDateTime.getMonthValue(), newDateTime.getDayOfMonth(), newDateTime.getHour(), newDateTime.getMinute());
            existingTask.updateSchedule(nearest);
            existingTask.convertToAIResult();
            updateTaskStatus(existingTask, TaskStatus.SUCCESS, resultMsg);
            log.info("[ScheduleChange] 할일에서 AI 트리거 완료 taskId={}, scheduleId={}", existingTask.getTaskId(), nearest.getScheduleId());
        } catch (Exception e) {
            log.error("[ScheduleChange] 할일 AI 트리거 실패: {}", e.getMessage(), e);
            updateTaskStatus(existingTask, TaskStatus.FAILED, "예약 변경 실패: " + e.getMessage());
        }
    }

    private Task saveTask(CareTarget careTarget, CallSchedule schedule, TaskStatus status, String result, LocalDateTime completedAt) {
        Task task = Task.builder()
                .organization(careTarget.getOrganization())
                .sourceType(TaskSourceType.AI)
                .type(TaskType.SCHEDULE_CHANGE)
                .careTarget(careTarget)
                .schedule(schedule)
                .status(status)
                .result(result)
                .startedAt(LocalDateTime.now())
                .completedAt(completedAt)
                .build();
        return taskRepository.save(task);
    }

    private void saveFailedTask(CareTarget careTarget, CallSchedule schedule, String reason) {
        saveTask(careTarget, schedule, TaskStatus.FAILED, reason, LocalDateTime.now());
    }

    private void updateTaskStatus(Task task, TaskStatus status, String result) {
        task.updateResultAndStatus(status, result, LocalDateTime.now());
        taskRepository.save(task);
    }

    @Override
    @Transactional
    public void createManualScheduleChangeTask(InboundSms inboundSms) {
        if (inboundSms == null || inboundSms.getSmsType() != SmsType.SCHEDULE_CHANGE) {
            return;
        }
        CareTarget careTarget = inboundSms.getCareTarget();
        if (careTarget == null) {
            log.info("[ScheduleChange] CareTarget 없음, 수동 Task 생성 불가 inboundSmsId={}", inboundSms.getInboundSmsId());
            return;
        }
        String body = inboundSms.getBody();
        String title = "예약 변경 요청 (수동 처리 필요)";
        String description = body != null && !body.isBlank()
                ? "[수신 문자] " + body + "\n\n※ 문자 자동화가 비활성화되어 있습니다. '시작' 버튼을 누르면 AI가 자동으로 처리합니다."
                : "예약 변경 요청이 수신되었습니다. '시작' 버튼을 누르면 AI가 자동으로 처리합니다.";
        Task task = Task.builder()
                .organization(careTarget.getOrganization())
                .sourceType(TaskSourceType.USER)
                .careTarget(careTarget)
                .inboundSms(inboundSms)
                .title(title)
                .description(description)
                .type(TaskType.SCHEDULE_CHANGE)
                .priority(Priority.MEDIUM)
                .status(TaskStatus.WAITING)
                .build();
        taskRepository.save(task);
        log.info("[ScheduleChange] 수동 처리용 Task 생성: taskId={}, careTargetId={}", task.getTaskId(), careTarget.getCareTargetId());
    }

    /** "앞으로/모두/이제부터/마다" 등이 포함되면 주기 변경 요청으로 판단 */
    private boolean isRecurringChangeRequest(String body) {
        if (body == null || body.isBlank()) {
            return false;
        }
        return RECURRING_CHANGE_PATTERN.matcher(body).find();
    }

    private LocalDateTime extractDateTimeFromBody(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        if (chatClient == null) {
            log.warn("[ScheduleChange] ChatClient 미설정, 날짜 추출 불가");
            return null;
        }
        String response = null;
        try {
            LocalDateTime now = LocalDateTime.now();
            String nowStr = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String dayOfWeekStr = now.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN);
            String prompt = DATE_EXTRACT_PROMPT.formatted(nowStr, dayOfWeekStr);
            response = chatClient.prompt()
                    .system(prompt)
                    .user("사용자 문자:\n" + body)
                    .call()
                    .content();

            if (response == null || response.trim().toUpperCase().contains("UNKNOWN")) {
                log.warn("[ScheduleChange] LLM 응답 UNKNOWN 또는 null body={}, response={}", body, response);
                return null;
            }
            String trimmed = response.trim();
            log.debug("[ScheduleChange] LLM 날짜 추출 응답: body={}, response={}", body, trimmed);
            // LLM이 설명을 붙인 경우 첫 번째 YYYY-MM-DD HH:mm 패턴 추출 (월/일/시/분 1~2자리 허용)
            Matcher m = Pattern.compile("\\d{4}-\\d{1,2}-\\d{1,2} \\d{1,2}:\\d{1,2}").matcher(trimmed);
            if (m.find()) {
                trimmed = m.group(0);
            }
            if (trimmed.length() > 16) {
                trimmed = trimmed.substring(0, 16);
            }
            // 시·분 한 자리 허용 (예: 2026-02-02 17:00, 2026-2-2 5:0)
            return LocalDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-M-d H:m"));
        } catch (DateTimeParseException e) {
            log.warn("[ScheduleChange] 날짜 파싱 예외 body={}, response={}: {}", body, response, e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("[ScheduleChange] LLM 날짜 추출 실패: {}", e.getMessage(), e);
            return null;
        }
    }

    private void sendChangeConfirmationSms(CareTarget careTarget, CallSchedule schedule) {
        String phone = careTarget.getTargetPhone();
        if (phone == null || phone.isBlank()) {
            log.warn("[ScheduleChange] 전화번호 없음 careTargetId={}", careTarget.getCareTargetId());
            return;
        }
        LocalDateTime dt = schedule.getNextRunAt() != null ? schedule.getNextRunAt() : schedule.getScheduledTime();
        String timeText = dt != null
                ? String.format("%d월 %d일 %d시 %02d분", dt.getMonthValue(), dt.getDayOfMonth(), dt.getHour(), dt.getMinute())
                : "확인된 시각";
        String name = (careTarget.getName() != null && !careTarget.getName().isBlank())
                ? careTarget.getName() + "님"
                : "고객님";
        String message = "[CarePilot 안내]\n%s 전화 예약이 %s으로 변경되었습니다.".formatted(name, timeText);
        try {
            String parsed = parsePhoneNumber(phone);
            String messageSid = twilioService.sendSms(parsed, message);
            outboundSmsRepository.save(OutboundSms.builder()
                    .messageSid(messageSid)
                    .fromNumber(twilioService.getFromNumber())
                    .toNumber(parsed)
                    .body(message)
                    .sentBy(SentBy.AI)
                    .build());
        } catch (Exception e) {
            log.error("[ScheduleChange] 확인 문자 발송 실패: {}", e.getMessage(), e);
        }
    }

    private String parsePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }
        String cleaned = phoneNumber.replaceAll("[\\s-]", "");
        if (cleaned.startsWith("+82")) return cleaned;
        if (cleaned.startsWith("010")) return "+82" + cleaned.substring(1);
        if (cleaned.startsWith("0")) return "+82" + cleaned.substring(1);
        return "+82" + cleaned;
    }
}
