package com.carepilot.service.callanalysis;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.service.callanalysis.schedule.AutoScheduleService;
import com.carepilot.service.callanalysis.schedule.ScheduleExtractionService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Log4j2
class AutoScheduleAutomationTests {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private ScheduleExtractionService extractionService;

    @Autowired
    private AutoScheduleService autoScheduleService;

    @Autowired
    private CallRepository callRepository;

    @Autowired
    private CallScheduleRepository callScheduleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("자연어 요청에서 스케줄 변경 정보 추출 테스트 (LLM 연동)")
    void testScheduleExtraction() {
        // Given
        String requestText = "월요일 전화를 3시로 변경해 주세요.";

        // When
        ScheduleExtractionResultDTO result = extractionService.extractScheduleRequest(requestText);

        // Then
        log.info("추출 결과: {}", result);
        assertThat(result.getIsScheduleChangeRequest()).isTrue();
        assertThat(result.getDayOfWeek()).isEqualTo("MONDAY");
        assertThat(result.getTargetTime()).isEqualTo("15:00");
    }

    @Test
    @DisplayName("추출된 정보를 바탕으로 실제 스케줄 업데이트 및 알림 생성 테스트")
    void testAutoScheduleUpdate() {
        // Given: 테스트용 Call 및 Schedule 조회 (DB에 데이터가 있다고 가정하거나 setUp에서 생성)
        // 여기서는 기존 데이터를 활용하거나 새로 생성하여 테스트
        Call call = callRepository.findAll().stream()
                .filter(c -> c.getCallSchedule() != null)
                .findFirst()
                .orElse(null);

        if (call == null) {
            log.warn("테스트를 위한 Call 데이터가 없습니다. 테스트를 스킵합니다.");
            return;
        }

        Long callId = call.getCallId();
        CallSchedule schedule = call.getCallSchedule();
        LocalDateTime originalNextRun = schedule.getNextRunAt();

        ScheduleExtractionResultDTO extractionResult = ScheduleExtractionResultDTO.builder()
                .isScheduleChangeRequest(true)
                .dayOfWeek("WEDNESDAY")
                .targetTime("14:30")
                .originalText("수요일 2시 반으로 바꿔줘")
                .build();

        // When
        autoScheduleService.processAutoScheduleUpdate(callId, extractionResult);

        // Then
        CallSchedule updatedSchedule = callScheduleRepository.findById(schedule.getScheduleId()).orElseThrow();
        log.info("업데이트 전: {}, 업데이트 후: {}", 
                originalNextRun != null ? originalNextRun.format(DATE_TIME_FORMATTER) : "null",
                updatedSchedule.getNextRunAt() != null ? updatedSchedule.getNextRunAt().format(DATE_TIME_FORMATTER) : "null");
        
        assertThat(updatedSchedule.getNextRunAt()).isNotNull();
        assertThat(updatedSchedule.getNextRunAt().getHour()).isEqualTo(14);
        assertThat(updatedSchedule.getNextRunAt().getMinute()).isEqualTo(30);

        // 알림 생성 확인
        List<Notification> notifications = notificationRepository.findByCallIdAndType(callId, NotificationType.SCHEDULE);
        assertThat(notifications).isNotEmpty();
        log.info("생성된 알림: {}", notifications.get(0).getDescription());
    }

    @Test
    @DisplayName("Call ID 62, CareTarget ID 3 - 요청사항 분석부터 스케줄 업데이트까지 전체 프로세스 테스트")
    void testScheduleExtractionAndUpdateForCall62() {
        // Given: Call ID 62, CareTarget ID 3
        Long callId = 62L;
        Long careTargetId = 3L;
        String requestText = "다음 주 수요일 오후 3시로 예약 변경해 주세요.";

        log.info("=== 테스트 시작: Call ID={}, CareTarget ID={}, 요청사항={} ===", 
                callId, careTargetId, requestText);

        // Step 1: LLM을 사용한 요청사항 분석 (스케줄 추출)
        log.info("[Step 1] LLM을 사용한 요청사항 분석 시작...");
        
        // extractionService가 제대로 주입되었는지 확인
        assertThat(extractionService).isNotNull();
        
        ScheduleExtractionResultDTO extractionResult = extractionService.extractScheduleRequest(requestText);
        
        log.info("[Step 1 결과] 추출 결과:");
        log.info("  - isScheduleChangeRequest: {}", extractionResult.getIsScheduleChangeRequest());
        log.info("  - dayOfWeek: {}", extractionResult.getDayOfWeek());
        log.info("  - targetTime: {}", extractionResult.getTargetTime());
        log.info("  - reason: {}", extractionResult.getReason());
        log.info("  - originalText: {}", extractionResult.getOriginalText());

        // 검증: LLM 분석 결과 확인
        if (!extractionResult.getIsScheduleChangeRequest()) {
            log.error("[검증 실패] isScheduleChangeRequest가 false입니다. LLM 응답 파싱에 실패했거나 요청사항이 인식되지 않았을 수 있습니다.");
            log.error("  - 실제 값: isScheduleChangeRequest={}, dayOfWeek={}, targetTime={}", 
                    extractionResult.getIsScheduleChangeRequest(),
                    extractionResult.getDayOfWeek(), 
                    extractionResult.getTargetTime());
        }
        
        assertThat(extractionResult.getIsScheduleChangeRequest())
                .withFailMessage("isScheduleChangeRequest가 true여야 합니다. 실제 값: %s, dayOfWeek: %s, targetTime: %s", 
                        extractionResult.getIsScheduleChangeRequest(),
                        extractionResult.getDayOfWeek(), 
                        extractionResult.getTargetTime())
                .isTrue();
        
        assertThat(extractionResult.getDayOfWeek())
                .withFailMessage("dayOfWeek가 WEDNESDAY여야 합니다. 실제 값: %s", extractionResult.getDayOfWeek())
                .isEqualTo("WEDNESDAY");
        
        assertThat(extractionResult.getTargetTime())
                .withFailMessage("targetTime이 15:00이어야 합니다. 실제 값: %s", extractionResult.getTargetTime())
                .isEqualTo("15:00");

        // Step 2: Call 조회 및 검증
        log.info("[Step 2] Call 조회 및 검증...");
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        
        log.info("  - Call ID: {}", call.getCallId());
        log.info("  - CareTarget ID: {}", call.getCareTarget().getCareTargetId());
        log.info("  - CallSchedule: {}", call.getCallSchedule() != null ? call.getCallSchedule().getScheduleId() : "null");
        
        assertThat(call.getCareTarget().getCareTargetId()).isEqualTo(careTargetId);

        // Step 3: 스케줄 업데이트 실행
        log.info("[Step 3] 스케줄 업데이트 실행...");
        LocalDateTime beforeNextRunAt = call.getCallSchedule() != null 
                ? call.getCallSchedule().getNextRunAt() 
                : null;
        
        autoScheduleService.processAutoScheduleUpdate(callId, extractionResult);

        // Step 4: 업데이트 결과 확인
        log.info("[Step 4] 업데이트 결과 확인...");
        Call updatedCall = callRepository.findById(callId).orElseThrow();
        CallSchedule updatedSchedule = updatedCall.getCallSchedule();
        
        if (updatedSchedule != null) {
            log.info("  - 업데이트 전 nextRunAt: {}", 
                    beforeNextRunAt != null ? beforeNextRunAt.format(DATE_TIME_FORMATTER) : "null");
            log.info("  - 업데이트 후 nextRunAt: {}", 
                    updatedSchedule.getNextRunAt() != null ? updatedSchedule.getNextRunAt().format(DATE_TIME_FORMATTER) : "null");
            log.info("  - Schedule ID: {}", updatedSchedule.getScheduleId());
            
            assertThat(updatedSchedule.getNextRunAt()).isNotNull();
            assertThat(updatedSchedule.getNextRunAt().getHour()).isEqualTo(15);
            assertThat(updatedSchedule.getNextRunAt().getMinute()).isEqualTo(0);
            
            // 요일 확인 (다음 주 수요일)
            assertThat(updatedSchedule.getNextRunAt().getDayOfWeek().name()).isEqualTo("WEDNESDAY");
        } else {
            log.warn("  - CallSchedule이 null입니다. 신규 스케줄이 생성되었을 수 있습니다.");
            // 신규 스케줄 생성 확인
            List<CallSchedule> newSchedules = callScheduleRepository.findAll().stream()
                    .filter(s -> s.getCareTarget().getCareTargetId().equals(careTargetId))
                    .filter(s -> s.getNextRunAt() != null && s.getNextRunAt().getHour() == 15)
                    .toList();
            
            assertThat(newSchedules).isNotEmpty();
            log.info("  - 신규 스케줄 생성됨: Schedule ID={}, nextRunAt={}", 
                    newSchedules.get(0).getScheduleId(), 
                    newSchedules.get(0).getNextRunAt() != null ? newSchedules.get(0).getNextRunAt().format(DATE_TIME_FORMATTER) : "null");
        }

        // Step 5: 알림 생성 확인
        log.info("[Step 5] 알림 생성 확인...");
        List<Notification> notifications = notificationRepository.findByCallIdAndType(callId, NotificationType.SCHEDULE);
        assertThat(notifications).isNotEmpty();
        log.info("  - 생성된 알림 개수: {}", notifications.size());
        log.info("  - 알림 제목: {}", notifications.get(0).getTitle());
        log.info("  - 알림 내용: {}", notifications.get(0).getDescription());

        log.info("=== 테스트 완료 ===");
    }
}


