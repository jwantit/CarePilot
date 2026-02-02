package com.carepilot.service.callanalysis.schedule;

import com.carepilot.domain.call.*;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
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
@RequiredArgsConstructor
public class AutoScheduleServiceImpl implements AutoScheduleService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final CallRepository callRepository;
    private final CallScheduleRepository callScheduleRepository;
    private final NotificationService notificationService;
    private final ScheduleExtractionService scheduleExtractionService;

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
    public void processAutoScheduleTask(Long callId, String transcript) {
        if (transcript == null || !transcript.contains("요청사항: ")) {
            return;
        }

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

                if (extractionResult.getIsScheduleChangeRequest()) {
                    log.info("[스케줄 자동화] 스케줄 업데이트 시작: callId={}", callId);
                    processAutoScheduleUpdate(callId, extractionResult);
                    log.info("[스케줄 자동화] 스케줄 업데이트 완료: callId={}", callId);
                } else {
                    log.info("[스케줄 자동화] 스케줄 변경 요청이 아님: callId={}", callId);
                }
            }
        } catch (Exception e) {
            log.error("[스케줄 자동화] 처리 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}

