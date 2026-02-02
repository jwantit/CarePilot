package com.carepilot.service.sms;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.OutboundSms;
import com.carepilot.domain.sms.SentBy;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.sms.OutboundSmsRepository;
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
            1. 요청한 요일이 "오늘"과 같고, 해당 시각이 아직 안 지났으면 → 오늘 날짜 + 그 시각. (예: 오늘이 월요일 14시인데 "월요일 4시" → 오늘 16:00)
            2. 요청한 요일이 오늘과 같지만 해당 시각이 이미 지났으면 → 다음 주 같은 요일 + 그 시각.
            3. 요청한 요일이 오늘보다 "이번 주에서 나중"이면 → 이번 주 그 요일 + 시각. (예: 오늘 월요일인데 "화요일 4시" → 내일 16:00)
            4. 요청한 요일이 오늘보다 "이번 주에서 이미 지남"(예: 오늘 월요일인데 "일요일") → 다음 주 그 요일 + 시각.
            5. 구체적 날짜가 있으면 그대로 YYYY-MM-DD HH:mm으로 출력.

            반드시 현재 시각의 날짜(년-월-일)와 요일을 정확히 보고, 위 규칙으로 "한 번"의 날짜만 출력하세요. 다른 요일로 바꾸지 마세요.

            응답 형식(이 형식만, 다른 글자 없음): YYYY-MM-DD HH:mm
            정말 추출할 수 없으면 정확히: UNKNOWN
            """;

    private final CallScheduleRepository callScheduleRepository;
    private final ScheduleNotificationService scheduleNotificationService;
    private final TwilioService twilioService;
    private final OutboundSmsRepository outboundSmsRepository;

    private final ChatClient chatClient;

    public ScheduleChangeServiceImpl(
            CallScheduleRepository callScheduleRepository,
            ScheduleNotificationService scheduleNotificationService,
            TwilioService twilioService,
            OutboundSmsRepository outboundSmsRepository,
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.callScheduleRepository = callScheduleRepository;
        this.scheduleNotificationService = scheduleNotificationService;
        this.twilioService = twilioService;
        this.outboundSmsRepository = outboundSmsRepository;
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
        // TODO: 개인이 그룹 스케줄 변경 요청 시 처리 방안
        List<CallSchedule> schedules = callScheduleRepository.findIndividualSchedulesByCareTargetAndStatus(
                careTarget, ScheduleStatus.SCHEDULED);
        if (schedules.isEmpty()) {
            log.info("[ScheduleChange] SCHEDULED 개인 예약 없음 careTargetId={}", careTarget.getCareTargetId());
            return;
        }

        // 가장 가까운 예약
        CallSchedule nearest = schedules.get(0);

        // 그룹 스케줄 체크 (혹시 모를 방어)
        if (nearest.getTargetType() == ScheduleTargetType.GROUP || nearest.getGroup() != null) {
            // TODO: 개인이 그룹 스케줄 변경 요청 시 처리 보류
            log.info("[ScheduleChange] 그룹 스케줄 변경 요청은 미지원(보류) scheduleId={}", nearest.getScheduleId());
            return;
        }

        // LLM으로 날짜 추출
        LocalDateTime newDateTime = extractDateTimeFromBody(inboundSms.getBody());
        if (newDateTime == null) {
            // TODO: 날짜 파싱 실패 시 처리 보류
            log.warn("[ScheduleChange] 날짜 파싱 실패 inboundSmsId={}, body={}", inboundSms.getInboundSmsId(), inboundSms.getBody());
            return;
        }

        // 단발 변경(기본): next_run_at만 변경. 주기 변경(앞으로/모두/이제부터/마다 등): scheduled_time + next_run_at 모두 변경
        boolean recurringChange = isRecurringChangeRequest(inboundSms.getBody());
        if (recurringChange) {
            nearest.applyUpdates(careTarget, newDateTime, null, null, null, null, null);
            nearest.rescheduleNextRunAt(newDateTime);
            log.info("[ScheduleChange] 주기 변경 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
        } else {
            nearest.applyUpdates(careTarget, null, null, null, null, null, null);
            nearest.rescheduleNextRunAt(newDateTime);
            log.info("[ScheduleChange] 단발 변경 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
        }
        callScheduleRepository.save(nearest);

        // 변경 확인 문자 발송
        sendChangeConfirmationSms(careTarget, nearest);
        log.info("[ScheduleChange] 예약 변경 완료 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
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
                log.debug("[ScheduleChange] LLM 응답 UNKNOWN 또는 null body={}", body);
                return null;
            }
            String trimmed = response.trim();
            // LLM이 설명을 붙인 경우 첫 번째 YYYY-MM-DD HH:mm 패턴 추출
            Matcher m = Pattern.compile("\\d{4}-\\d{2}-\\d{2} \\d{1,2}:\\d{2}").matcher(trimmed);
            if (m.find()) {
                trimmed = m.group(0);
                if (trimmed.length() > 16) {
                    trimmed = trimmed.substring(0, 16);
                }
            } else if (trimmed.length() > 16) {
                trimmed = trimmed.substring(0, 16);
            }
            // 시·분 한 자리 허용 (예: 4시 → 4, 9시 5분 → 9:05)
            return LocalDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-MM-d H:m"));
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
