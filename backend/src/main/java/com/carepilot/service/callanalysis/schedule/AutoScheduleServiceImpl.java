package com.carepilot.service.callanalysis.schedule;

import com.carepilot.domain.call.*;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;
import com.carepilot.dto.config.AIConfigDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.service.config.ai.AiConfigService;
import com.carepilot.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

@Service
@Log4j2
public class AutoScheduleServiceImpl implements AutoScheduleService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final CallRepository callRepository;
    private final CallScheduleRepository callScheduleRepository;
    private final NotificationService notificationService;
    private final ScheduleExtractionService scheduleExtractionService;
    private final TaskRepository taskRepository;
    private final AiConfigService aiConfigService;
    private final ChatClient chatClient;

    public AutoScheduleServiceImpl(
            CallRepository callRepository,
            CallScheduleRepository callScheduleRepository,
            NotificationService notificationService,
            ScheduleExtractionService scheduleExtractionService,
            TaskRepository taskRepository,
            AiConfigService aiConfigService,
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.callRepository = callRepository;
        this.callScheduleRepository = callScheduleRepository;
        this.notificationService = notificationService;
        this.scheduleExtractionService = scheduleExtractionService;
        this.taskRepository = taskRepository;
        this.aiConfigService = aiConfigService;
        this.chatClient = chatClient;
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processAutoScheduleUpdate(Long callId, ScheduleExtractionResultDTO extractionResult) {
        log.info("[스케줄 자동화] processAutoScheduleUpdate 호출: callId={}, isScheduleChangeRequest={}", 
                callId, extractionResult.getIsScheduleChangeRequest());
        
        if (!extractionResult.getIsScheduleChangeRequest()) {
            log.warn("[스케줄 자동화] 스케줄 변경 요청이 아님: callId={}", callId);
            return;
        }

        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        
        log.info("[스케줄 자동화] Call 조회 완료: callId={}, callSchedule={}", 
                callId, call.getCallSchedule() != null ? call.getCallSchedule().getScheduleId() : "null");

        try {
            LocalDateTime nextRunAt = calculateNextRunAt(extractionResult);
            CallSchedule schedule = call.getCallSchedule();
            String description;

            if (schedule != null) {
                // [Case 1] 기존 스케줄이 있는 경우: 업데이트
                LocalDateTime beforeRunAt = schedule.getNextRunAt();
                log.info("[스케줄 자동화] 업데이트 전: scheduleId={}, beforeNextRunAt={}, 계산된 nextRunAt={}", 
                        schedule.getScheduleId(), 
                        beforeRunAt != null ? beforeRunAt.format(DATE_TIME_FORMATTER) : "null",
                        nextRunAt.format(DATE_TIME_FORMATTER));
                
                schedule.rescheduleNextRunAt(nextRunAt);
                // saveAndFlush를 사용하여 즉시 DB에 반영
                CallSchedule savedSchedule = callScheduleRepository.saveAndFlush(schedule);
                
                // 저장 직후 확인
                log.info("[스케줄 자동화] saveAndFlush 직후 확인: scheduleId={}, savedNextRunAt={}", 
                        savedSchedule.getScheduleId(), 
                        savedSchedule.getNextRunAt() != null ? savedSchedule.getNextRunAt().format(DATE_TIME_FORMATTER) : "null");

                log.info("[스케줄 자동화] 기존 스케줄 업데이트 완료: scheduleId={}, nextRunAt={}", 
                        schedule.getScheduleId(), nextRunAt.format(DATE_TIME_FORMATTER));

                description = String.format("케어 대상 요청으로 통화 스케줄이 변경되었습니다.\n변경 전: %s\n변경 후: %s\n요청내용: %s",
                        beforeRunAt != null ? beforeRunAt.format(DATE_TIME_FORMATTER) : "미정",
                        nextRunAt.format(DATE_TIME_FORMATTER),
                        extractionResult.getOriginalText());
            } else {
                // [Case 2] 연결된 스케줄이 없는 경우: 신규 일회성 스케줄 생성
                schedule = CallSchedule.builder()
                        .organization(call.getOrganization())
                        .careTarget(call.getCareTarget())
                        .targetType(ScheduleTargetType.CARE_TARGET)
                        .type(ScheduleType.ONE_TIME)
                        .scheduledTime(nextRunAt)
                        .nextRunAt(nextRunAt)
                        .priority(com.carepilot.domain.enums.Priority.MEDIUM)
                        .status(ScheduleStatus.SCHEDULED)
                        .memo("AI 자동 생성: " + extractionResult.getOriginalText())
                        .build();
                
                callScheduleRepository.save(schedule);
                
                log.info("[스케줄 자동화] 신규 일회성 스케줄 생성 완료: nextRunAt={}", nextRunAt.format(DATE_TIME_FORMATTER));

                description = String.format("케어 대상 요청으로 새로운 통화 스케줄이 등록되었습니다.\n예정 시간: %s\n요청내용: %s",
                        nextRunAt.format(DATE_TIME_FORMATTER),
                        extractionResult.getOriginalText());
            }

            notificationService.createOrganizationNotification(
                    call.getOrganization().getOrganizationId(),
                    NotificationType.SCHEDULE,
                    "통화 스케줄 자동화 안내",
                    description,
                    RiskLevel.LOW,
                    call,
                    call.getCareTarget()
            );

        } catch (Exception e) {
            log.error("[스케줄 자동화] 처리 중 오류 발생: {}", e.getMessage(), e);
        }
    }

    /**
     * 추출된 요일과 시간을 바탕으로 가장 가까운 미래의 LocalDateTime을 계산합니다.
     * "다음 주" 표현을 처리합니다.
     */
    private LocalDateTime calculateNextRunAt(ScheduleExtractionResultDTO result) {
        LocalTime targetTime = result.getTargetTime() != null 
                ? LocalTime.parse(result.getTargetTime()) 
                : LocalTime.of(10, 0); // 기본값 오전 10시

        LocalDate today = LocalDate.now();
        LocalDate targetDate;

        if (result.getDayOfWeek() != null) {
            DayOfWeek targetDay = DayOfWeek.valueOf(result.getDayOfWeek());
            
            // "다음 주" 표현 확인 (originalText에 "다음 주", "다음주", "내주" 등이 포함되어 있는지)
            String originalText = result.getOriginalText() != null ? result.getOriginalText().toLowerCase() : "";
            boolean isNextWeek = originalText.contains("다음 주") || 
                                originalText.contains("다음주") || 
                                originalText.contains("내주") ||
                                originalText.contains("다음");
            
            if (isNextWeek) {
                // 다음 주로 설정: 이번 주의 해당 요일을 찾고 7일을 더함
                LocalDate thisWeekTarget = today.with(TemporalAdjusters.nextOrSame(targetDay));
                targetDate = thisWeekTarget.plusWeeks(1);
                log.info("[스케줄 자동화] '다음 주' 감지: 오늘={}, 이번 주 {}={}, 다음 주 {}={}", 
                        today, targetDay, thisWeekTarget, targetDay, targetDate);
            } else {
                // 이번 주 또는 다음 주 (가장 가까운 미래)
                targetDate = today.with(TemporalAdjusters.nextOrSame(targetDay));
                
                // 만약 오늘이고 시간이 이미 지났다면 다음 주로 설정
                if (targetDate.equals(today) && targetTime.isBefore(LocalTime.now())) {
                    targetDate = targetDate.with(TemporalAdjusters.next(targetDay));
                    log.info("[스케줄 자동화] 시간이 지나서 다음 주로 설정: {}", targetDate);
                }
            }
        } else {
            // 요일이 없으면 내일 같은 시간으로 설정
            targetDate = today.plusDays(1);
        }

        LocalDateTime resultDateTime = LocalDateTime.of(targetDate, targetTime);
        log.info("[스케줄 자동화] 계산된 nextRunAt: {}", resultDateTime.format(DATE_TIME_FORMATTER));
        return resultDateTime;
    }

    @Override
    @Transactional
    public void processAutoScheduleUpdateOnly(Long callId, String requestText) {
        log.info("[스케줄 자동화] processAutoScheduleUpdateOnly 호출: callId={}, requestText={}", 
                callId, requestText);
        
        try {
            // 1. 요청사항 분석 (스케줄 추출)
            ScheduleExtractionResultDTO extractionResult = scheduleExtractionService.extractScheduleRequest(requestText);
            
            log.info("[스케줄 자동화] 추출 결과: isScheduleChangeRequest={}, dayOfWeek={}, targetTime={}", 
                    extractionResult.getIsScheduleChangeRequest(),
                    extractionResult.getDayOfWeek(), 
                    extractionResult.getTargetTime());

            if (!extractionResult.getIsScheduleChangeRequest()) {
                log.warn("[스케줄 자동화] 스케줄 변경 요청이 아님: callId={}", callId);
                return;
            }

            // 2. Call 조회 및 ai_memo 업데이트
            Call call = callRepository.findById(callId)
                    .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
            
            String requirementMemo = generateRequirementMemo(requestText, extractionResult);
            call.updateAiMemo(requirementMemo);
            callRepository.saveAndFlush(call);
            log.info("[스케줄 자동화] ai_memo 업데이트 완료: callId={}, memo={}", callId, requirementMemo);

            // 3. 실제 스케줄 업데이트 실행
            processAutoScheduleUpdate(callId, extractionResult);
            
        } catch (Exception e) {
            log.error("[스케줄 자동화] processAutoScheduleUpdateOnly 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("자동화 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void processAutoScheduleTask(Long callId, String transcript) {
        if (transcript == null || !transcript.contains("요청사항: ")) {
            return;
        }

        Task aiTask = null;
        try {
            // "요청사항: " 이후의 텍스트 추출
            int index = transcript.lastIndexOf("요청사항: ");
            String requestText = transcript.substring(index + 6).trim();

            if (!requestText.isEmpty()) {
                log.info("[스케줄 자동화] 요청사항 분석 시작: {}", requestText);
                ScheduleExtractionResultDTO extractionResult = scheduleExtractionService.extractScheduleRequest(requestText);

                log.info("[스케줄 자동화] 추출 결과: isScheduleChangeRequest={}, dayOfWeek={}, targetTime={}", 
                        extractionResult.getIsScheduleChangeRequest(),
                        extractionResult.getDayOfWeek(), 
                        extractionResult.getTargetTime());

                // Call 조회
                Call call = callRepository.findById(callId)
                        .orElseThrow(() -> new RuntimeException("Call not found: " + callId));

                // LLM을 사용하여 요구사항을 한 줄로 정리
                String requirementMemo = generateRequirementMemo(requestText, extractionResult);
                call.updateAiMemo(requirementMemo);
                callRepository.save(call);
                log.info("[스케줄 자동화] ai_memo 업데이트 완료: callId={}, memo={}", callId, requirementMemo);

                // AI 설정값 확인
                AIConfigDTO callAutomationConfig = aiConfigService.getAIConfig(
                    call.getOrganization().getOrganizationId(), 
                    "CALL_AUTOMATION"
                );
                boolean isCallAutomationEnabled = callAutomationConfig.getIsEnabled();
                log.info("[스케줄 자동화] CALL_AUTOMATION 설정: {}", isCallAutomationEnabled ? "ON" : "OFF");

                if (extractionResult.getIsScheduleChangeRequest()) {
                    if (isCallAutomationEnabled) {
                        // ON일 때: Task를 SUCCESS로 생성하고 자동화 함수 실행
                        aiTask = Task.builder()
                                .organization(call.getOrganization())
                                .sourceType(TaskSourceType.AI)
                                .type(TaskType.SCHEDULE_CHANGE)
                                .call(call)
                                .careTarget(call.getCareTarget())
                                .status(TaskStatus.SUCCESS)  // SUCCESS로 생성
                                .title("AI 스케줄 변경 요청")
                                .description("AI가 통화에서 스케줄 변경 요청을 감지하고 자동으로 처리했습니다.\n\n" +
                                        "요청사항: " + requestText + "\n" +
                                        "추출된 요일: " + (extractionResult.getDayOfWeek() != null ? extractionResult.getDayOfWeek() : "미지정") + "\n" +
                                        "추출된 시간: " + (extractionResult.getTargetTime() != null ? extractionResult.getTargetTime() : "미지정") + "\n" +
                                        "원문: " + extractionResult.getOriginalText())
                                .result("스케줄 변경 자동화 작업 완료: " + extractionResult.getOriginalText())
                                .startedAt(LocalDateTime.now())
                                .build();
                        aiTask = taskRepository.save(aiTask);
                        log.info("[스케줄 자동화] Task(AI, SUCCESS) 생성 (자동화 ON): taskId={}", aiTask.getTaskId());

                        // 자동화 함수 실행
                        log.info("[스케줄 자동화] 스케줄 업데이트 시작: callId={}", callId);
                        processAutoScheduleUpdate(callId, extractionResult);
                        
                        // 스케줄 업데이트 성공 후 Task에 스케줄 정보 업데이트
                        if (aiTask != null) {
                            Call updatedCall = callRepository.findById(callId).orElse(null);
                            aiTask = taskRepository.findById(aiTask.getTaskId()).orElse(null);
                            if (aiTask != null && updatedCall != null && updatedCall.getCallSchedule() != null) {
                                aiTask.updateSchedule(updatedCall.getCallSchedule());
                                aiTask.updateResultAndStatus(TaskStatus.SUCCESS,
                                        "스케줄 변경 자동화 작업 완료: " + extractionResult.getOriginalText(),
                                        LocalDateTime.now());
                                taskRepository.save(aiTask);
                                log.info("[스케줄 자동화] Task(AI, SUCCESS) 스케줄 정보 업데이트 완료: taskId={}, scheduleId={}",
                                        aiTask.getTaskId(),
                                        updatedCall.getCallSchedule().getScheduleId());
                            }
                        }
                        
                        log.info("[스케줄 자동화] 스케줄 업데이트 완료 (자동화 ON): callId={}", callId);
                    } else {
                        // OFF일 때: Task를 WAITING으로 생성하고 자동화 함수 실행하지 않음
                        aiTask = Task.builder()
                                .organization(call.getOrganization())
                                .sourceType(TaskSourceType.USER)  // USER로 변경
                                .type(TaskType.SCHEDULE_CHANGE)
                                .call(call)
                                .careTarget(call.getCareTarget())
                                .status(TaskStatus.WAITING)  // WAITING으로 생성
                                .title("AI 스케줄 변경 요청 확인")
                                .description("AI가 통화에서 스케줄 변경 요청을 감지했습니다. 확인 후 처리해 주세요.\n\n" +
                                        "요청사항: " + requestText + "\n" +
                                        "추출된 요일: " + (extractionResult.getDayOfWeek() != null ? extractionResult.getDayOfWeek() : "미지정") + "\n" +
                                        "추출된 시간: " + (extractionResult.getTargetTime() != null ? extractionResult.getTargetTime() : "미지정") + "\n" +
                                        "원문: " + extractionResult.getOriginalText())
                                .priority(Priority.HIGH)
                                .dueDate(LocalDateTime.now().plusDays(1))  // 다음 날까지 처리하도록 기한 설정
                                .build();
                        aiTask = taskRepository.save(aiTask);
                        log.info("[스케줄 자동화] Task(USER, WAITING) 생성 (자동화 OFF, 실행 안 함): taskId={}", aiTask.getTaskId());
                    }
                } else {
                    log.info("[스케줄 자동화] 스케줄 변경 요청이 아님: callId={}", callId);
                }
            }
        } catch (Exception e) {
            log.error("[스케줄 자동화] 처리 중 오류 발생: {}", e.getMessage(), e);
            
            // 오류 발생 시 Task 상태를 FAILED로 업데이트
            if (aiTask != null) {
                try {
                    aiTask = taskRepository.findById(aiTask.getTaskId()).orElse(null);
                    if (aiTask != null) {
                        aiTask.updateResultAndStatus(TaskStatus.FAILED,
                                "스케줄 변경 자동화 작업 실패: " + e.getMessage(),
                                LocalDateTime.now());
                        taskRepository.save(aiTask);
                        log.info("[스케줄 자동화] Task(AI) 실패 처리: taskId={}", aiTask.getTaskId());
                    }
                } catch (Exception ex) {
                    log.error("[스케줄 자동화] Task(AI) 실패 처리 중 오류: {}", ex.getMessage(), ex);
                }
            }
        }
    }

    /**
     * LLM을 사용하여 요구사항을 한 줄 메모로 정리합니다.
     */
    private String generateRequirementMemo(String requestText, ScheduleExtractionResultDTO extractionResult) {
        if (chatClient == null) {
            log.warn("[스케줄 자동화] ChatClient 미설정, 기본 메모 반환");
            return "요구사항: " + requestText;
        }

        try {
            String prompt = String.format(
                    "다음 요구사항을 간결하게 한 줄로 정리해주세요. 포맷이나 구조화된 형식 없이 자연스러운 문장으로 작성해주세요.\n\n" +
                    "요구사항: %s\n" +
                    "요일: %s\n" +
                    "시간: %s\n" +
                    "스케줄 변경 요청 여부: %s",
                    requestText,
                    extractionResult.getDayOfWeek() != null ? extractionResult.getDayOfWeek() : "미지정",
                    extractionResult.getTargetTime() != null ? extractionResult.getTargetTime() : "미지정",
                    extractionResult.getIsScheduleChangeRequest() ? "예" : "아니오"
            );

            String memo = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            log.info("[스케줄 자동화] LLM으로 생성된 메모: {}", memo);
            return memo != null && !memo.trim().isEmpty() ? memo.trim() : "요구사항: " + requestText;
        } catch (Exception e) {
            log.error("[스케줄 자동화] LLM 메모 생성 실패: {}", e.getMessage(), e);
            return "요구사항: " + requestText;
        }
    }
}

