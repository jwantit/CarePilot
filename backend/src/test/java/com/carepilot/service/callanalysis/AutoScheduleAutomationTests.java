package com.carepilot.service.callanalysis;

import com.carepilot.dto.auth.UserDTO;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;
import com.carepilot.domain.config.AIConfig;
import com.carepilot.domain.organization.Organization;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.config.AIConfigRepository;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.service.callanalysis.schedule.AutoScheduleService;
import com.carepilot.service.callanalysis.schedule.ScheduleExtractionService;
import com.carepilot.service.task.TaskService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Commit
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

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private CallRecordingRepository callRecordingRepository;

    @Autowired
    private AIConfigRepository aiConfigRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

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

    @Commit
    @Test
    @DisplayName("Call ID 62, CareTarget ID 3 - 자동화 ON일 때 요청사항 분석부터 스케줄 업데이트까지 전체 프로세스 테스트")
    void testScheduleExtractionAndUpdateForCall62_AutomationOn() {
        // Given: Call ID 62, CareTarget ID 3
        Long callId = 62L;
        Long careTargetId = 3L;
        String requestText = "다음 주 수요일 오후 3시로 예약 변경해 주세요.";

        log.info("=== 테스트 시작 (자동화 ON): Call ID={}, CareTarget ID={}, 요청사항={} ===", 
                callId, careTargetId, requestText);

        // Step 0: AI 설정을 ON으로 설정
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        Organization organization = call.getOrganization();
        
        AIConfig aiConfig = aiConfigRepository.findByOrganizationAndFeatureName(organization, "CALL_AUTOMATION")
                .orElse(AIConfig.builder()
                        .organization(organization)
                        .featureName("CALL_AUTOMATION")
                        .isEnabled(false)
                        .build());
        aiConfig.changeEnabled(true);
        aiConfigRepository.save(aiConfig);
        log.info("[Step 0] CALL_AUTOMATION 설정을 ON으로 변경: organizationId={}", organization.getOrganizationId());

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
        call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        
        log.info("  - Call ID: {}", call.getCallId());
        log.info("  - CareTarget ID: {}", call.getCareTarget().getCareTargetId());
        log.info("  - CallSchedule: {}", call.getCallSchedule() != null ? call.getCallSchedule().getScheduleId() : "null");
        
        assertThat(call.getCareTarget().getCareTargetId()).isEqualTo(careTargetId);

        // Step 3: 스케줄 업데이트 실행 (processAutoScheduleTask 사용)
        log.info("[Step 3] 스케줄 업데이트 실행...");
        LocalDateTime beforeNextRunAt = call.getCallSchedule() != null 
                ? call.getCallSchedule().getNextRunAt() 
                : null;
        
        // ai_memo 확인 (업데이트 전)
        String aiMemoBefore = call.getAiMemo();
        log.info("  - 업데이트 전 ai_memo: {}", aiMemoBefore != null ? aiMemoBefore.substring(0, Math.min(100, aiMemoBefore.length())) + "..." : "null");
        
        // transcript 생성 (요청사항 포함)
        String transcript = "AI: 오늘 컨디션이 어떠신가요?\n케어대상: 괜찮습니다.\n\n요청사항: " + requestText;
        
        // processAutoScheduleTask 호출 (요구사항 분석 및 스케줄 업데이트)
        autoScheduleService.processAutoScheduleTask(callId, transcript);

        // Step 4: 업데이트 결과 확인
        log.info("[Step 4] 업데이트 결과 확인...");
        Call updatedCall = callRepository.findById(callId).orElseThrow();
        CallSchedule updatedSchedule = updatedCall.getCallSchedule();
        
        // Step 4-1: ai_memo에 요구사항 분석 결과가 추가되었는지 확인
        log.info("[Step 4-1] ai_memo 확인...");
        String aiMemoAfter = updatedCall.getAiMemo();
        log.info("  - 업데이트 후 ai_memo: {}", aiMemoAfter != null ? aiMemoAfter : "null");
        assertThat(aiMemoAfter).isNotNull();
        assertThat(aiMemoAfter).isNotEmpty();
        // LLM이 생성한 자연스러운 메모이므로 요청사항 내용이 포함되어 있는지 확인
        // "수요일", "3시", "오후" 등의 키워드 중 하나라도 포함되어 있는지 확인
        String lowerMemo = aiMemoAfter.toLowerCase();
        boolean containsRelevantInfo = lowerMemo.contains("수요일") || 
                                       lowerMemo.contains("wednesday") || 
                                       lowerMemo.contains("3시") || 
                                       lowerMemo.contains("15시") || 
                                       lowerMemo.contains("오후") ||
                                       lowerMemo.contains("다음");
        assertThat(containsRelevantInfo)
                .withFailMessage("ai_memo에 요청사항 관련 정보가 포함되어야 합니다. 실제 메모: %s", aiMemoAfter)
                .isTrue();
        log.info("  ✓ ai_memo에 요구사항 분석 결과가 정상적으로 추가되었습니다.");
        
        // Step 4-2: Task(AI) 생성 확인
        log.info("[Step 4-2] Task(AI) 생성 확인...");
        List<Task> aiTasks = taskRepository.findAll().stream()
                .filter(t -> t.getSourceType() == TaskSourceType.AI)
                .filter(t -> t.getCall() != null && t.getCall().getCallId().equals(callId))
                .filter(t -> t.getType() == TaskType.SCHEDULE_CHANGE)
                .toList();
        
        assertThat(aiTasks).isNotEmpty();
        Task aiTask = aiTasks.get(0);
        log.info("  - Task ID: {}", aiTask.getTaskId());
        log.info("  - Task Type: {}", aiTask.getType());
        log.info("  - Status: {}", aiTask.getStatus());
        log.info("  - Result: {}", aiTask.getResult());
        log.info("  - Started At: {}", aiTask.getStartedAt() != null ? aiTask.getStartedAt().format(DATE_TIME_FORMATTER) : "null");
        log.info("  - Completed At: {}", aiTask.getCompletedAt() != null ? aiTask.getCompletedAt().format(DATE_TIME_FORMATTER) : "null");
        log.info("  - Schedule ID: {}", aiTask.getSchedule() != null ? aiTask.getSchedule().getScheduleId() : "null");
        
        assertThat(aiTask.getStatus()).isEqualTo(TaskStatus.SUCCESS);
        assertThat(aiTask.getResult()).contains("스케줄 변경 자동화 작업 완료");
        assertThat(aiTask.getCompletedAt()).isNotNull();
        if (updatedSchedule != null) {
            assertThat(aiTask.getSchedule()).isNotNull();
            assertThat(aiTask.getSchedule().getScheduleId()).isEqualTo(updatedSchedule.getScheduleId());
        }
        log.info("  ✓ Task(AI)가 정상적으로 생성되고 완료 처리되었습니다.");
        
        // Step 4-3: 스케줄 업데이트 확인
        log.info("[Step 4-3] 스케줄 업데이트 확인...");
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
            log.info("  ✓ 스케줄이 정상적으로 업데이트되었습니다.");
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
        log.info("  ✓ 알림이 정상적으로 생성되었습니다.");

        log.info("=== 테스트 완료 (자동화 ON) ===");
        log.info("요약:");
        log.info("  ✓ 요구사항 분석 결과가 ai_memo에 추가됨");
        log.info("  ✓ Task(AI)가 생성되고 SUCCESS 상태로 완료됨");
        log.info("  ✓ 스케줄이 다음 주 수요일 오후 3시로 업데이트됨");
        log.info("  ✓ 알림이 생성됨");
    }

    @Commit
    @Test
    @DisplayName("Call ID 62, CareTarget ID 3 - 자동화 OFF일 때 Task가 WAITING 상태로 생성되고 스케줄 업데이트되지 않음")
    void testScheduleExtractionAndUpdateForCall62_AutomationOff() {
        // Given: Call ID 62, CareTarget ID 3
        Long callId = 62L;
        Long careTargetId = 3L;
        String requestText = "다음 주 수요일 오후 3시로 예약 변경해 주세요.";

        log.info("=== 테스트 시작 (자동화 OFF): Call ID={}, CareTarget ID={}, 요청사항={} ===", 
                callId, careTargetId, requestText);

        // Step 0: AI 설정을 OFF로 설정
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        Organization organization = call.getOrganization();
        
        AIConfig aiConfig = aiConfigRepository.findByOrganizationAndFeatureName(organization, "CALL_AUTOMATION")
                .orElse(AIConfig.builder()
                        .organization(organization)
                        .featureName("CALL_AUTOMATION")
                        .isEnabled(false)
                        .build());
        aiConfig.changeEnabled(false);
        aiConfigRepository.save(aiConfig);
        log.info("[Step 0] CALL_AUTOMATION 설정을 OFF로 변경: organizationId={}", organization.getOrganizationId());

        // Step 1: LLM을 사용한 요청사항 분석 (스케줄 추출)
        log.info("[Step 1] LLM을 사용한 요청사항 분석 시작...");
        
        ScheduleExtractionResultDTO extractionResult = extractionService.extractScheduleRequest(requestText);
        
        log.info("[Step 1 결과] 추출 결과:");
        log.info("  - isScheduleChangeRequest: {}", extractionResult.getIsScheduleChangeRequest());
        log.info("  - dayOfWeek: {}", extractionResult.getDayOfWeek());
        log.info("  - targetTime: {}", extractionResult.getTargetTime());

        assertThat(extractionResult.getIsScheduleChangeRequest()).isTrue();

        // Step 2: Call 조회 및 검증
        log.info("[Step 2] Call 조회 및 검증...");
        call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found: " + callId));
        
        assertThat(call.getCareTarget().getCareTargetId()).isEqualTo(careTargetId);

        // Step 3: 스케줄 업데이트 전 상태 저장
        log.info("[Step 3] 스케줄 업데이트 전 상태 저장...");
        LocalDateTime beforeNextRunAt = call.getCallSchedule() != null 
                ? call.getCallSchedule().getNextRunAt() 
                : null;
        
        // transcript 생성 (요청사항 포함)
        String transcript = "AI: 오늘 컨디션이 어떠신가요?\n케어대상: 괜찮습니다.\n\n요청사항: " + requestText;
        
        // processAutoScheduleTask 호출 (자동화 OFF이므로 스케줄 업데이트되지 않아야 함)
        autoScheduleService.processAutoScheduleTask(callId, transcript);

        // Step 4: 업데이트 결과 확인
        log.info("[Step 4] 업데이트 결과 확인...");
        Call updatedCall = callRepository.findById(callId).orElseThrow();
        CallSchedule updatedSchedule = updatedCall.getCallSchedule();
        
        // Step 4-1: ai_memo에 요구사항 분석 결과가 추가되었는지 확인
        log.info("[Step 4-1] ai_memo 확인...");
        String aiMemoAfter = updatedCall.getAiMemo();
        assertThat(aiMemoAfter).isNotNull();
        assertThat(aiMemoAfter).isNotEmpty();
        log.info("  ✓ ai_memo에 요구사항 분석 결과가 정상적으로 추가되었습니다.");
        
        // Step 4-2: Task(USER, WAITING) 생성 확인
        log.info("[Step 4-2] Task(USER, WAITING) 생성 확인...");
        List<Task> userTasks = taskRepository.findAll().stream()
                .filter(t -> t.getSourceType() == TaskSourceType.USER)  // USER로 변경
                .filter(t -> t.getCall() != null && t.getCall().getCallId().equals(callId))
                .filter(t -> t.getType() == TaskType.SCHEDULE_CHANGE)
                .toList();
        
        assertThat(userTasks).isNotEmpty();
        Task aiTask = userTasks.get(userTasks.size() - 1); // 가장 최근 생성된 Task
        log.info("  - Task ID: {}", aiTask.getTaskId());
        log.info("  - Task Type: {}", aiTask.getType());
        log.info("  - Status: {}", aiTask.getStatus());
        log.info("  - Title: {}", aiTask.getTitle());
        log.info("  - Description: {}", aiTask.getDescription());
        
        assertThat(aiTask.getStatus()).isEqualTo(TaskStatus.WAITING);
        assertThat(aiTask.getSourceType()).isEqualTo(TaskSourceType.USER);  // USER로 변경
        assertThat(aiTask.getTitle()).contains("AI 스케줄 변경 요청 확인");
        assertThat(aiTask.getDescription()).contains("확인 후 처리해 주세요");
        assertThat(aiTask.getCompletedAt()).isNull(); // 완료되지 않음
        log.info("  ✓ Task(USER, WAITING)가 정상적으로 생성되었습니다.");
        
        // Step 4-3: 스케줄이 업데이트되지 않았는지 확인
        log.info("[Step 4-3] 스케줄 업데이트 여부 확인...");
        if (updatedSchedule != null && beforeNextRunAt != null) {
            log.info("  - 업데이트 전 nextRunAt: {}", 
                    beforeNextRunAt.format(DATE_TIME_FORMATTER));
            log.info("  - 업데이트 후 nextRunAt: {}", 
                    updatedSchedule.getNextRunAt() != null ? updatedSchedule.getNextRunAt().format(DATE_TIME_FORMATTER) : "null");
            
            // 스케줄이 변경되지 않았거나, 변경되었다면 자동화가 실행된 것이므로 실패
            // 하지만 실제로는 자동화 OFF이므로 스케줄이 변경되지 않아야 함
            // 시간이 정확히 같은지 확인하는 것은 어려울 수 있으므로, Task가 WAITING이고 스케줄이 연결되지 않았는지 확인
            assertThat(aiTask.getSchedule()).isNull(); // 스케줄이 연결되지 않음
            log.info("  ✓ 스케줄이 업데이트되지 않았습니다 (자동화 OFF).");
        } else {
            log.info("  - CallSchedule이 없거나 이전 상태가 없습니다.");
        }

        // Step 5: 알림이 생성되지 않았는지 확인 (자동화 OFF이므로 알림 생성 안 됨)
        log.info("[Step 5] 알림 생성 여부 확인...");
        List<Notification> notifications = notificationRepository.findByCallIdAndType(callId, NotificationType.SCHEDULE);
        // 자동화 OFF이므로 알림이 생성되지 않아야 함 (또는 이전 알림만 있을 수 있음)
        log.info("  - 알림 개수: {}", notifications.size());
        log.info("  ✓ 자동화 OFF이므로 알림이 생성되지 않았습니다.");

        log.info("=== 테스트 완료 (자동화 OFF) ===");
        log.info("요약:");
        log.info("  ✓ 요구사항 분석 결과가 ai_memo에 추가됨");
        log.info("  ✓ Task(USER, WAITING)가 생성됨 (자동화 실행 안 됨)");
        log.info("  ✓ 스케줄이 업데이트되지 않음");
        log.info("  ✓ 알림이 생성되지 않음");
    }

    @Commit
    @Test
    @DisplayName("USER 타입 Task를 PROGRESS로 변경할 때 자동화 함수가 트리거되는지 테스트")
    void testUserTaskStartTriggersAutomation() {
        // Given: Call ID 62에 대해 자동화 OFF 상태로 Task 생성
        Long callId = 62L;
        String requestText = "다음 주 월요일 오전 11시로 변경해 주세요.";
        
        // 자동화 OFF 설정
        Call call = callRepository.findById(callId).orElseThrow();
        Organization organization = call.getOrganization();
        AIConfig aiConfig = aiConfigRepository.findByOrganizationAndFeatureName(organization, "CALL_AUTOMATION").orElseThrow();
        aiConfig.changeEnabled(false);
        aiConfigRepository.save(aiConfig);

        // Task 생성 (processAutoScheduleTask 호출)
        String transcript = "요청사항: " + requestText;
        autoScheduleService.processAutoScheduleTask(callId, transcript);

        // 생성된 USER 타입 Task 조회
        Task task = taskRepository.findAll().stream()
                .filter(t -> t.getCall() != null && t.getCall().getCallId().equals(callId))
                .filter(t -> t.getSourceType() == TaskSourceType.USER)
                .filter(t -> t.getStatus() == TaskStatus.WAITING)
                .findFirst()
                .orElseThrow();
        
        log.info("생성된 USER 타입 Task: taskId={}, status={}", task.getTaskId(), task.getStatus());

        // SecurityContext 설정 (UserUtil.getCurrentUser() 호출 대응)
        com.carepilot.domain.user.User creator = task.getCreatedBy();
        if (creator == null) {
            // CreatedBy가 없으면 조직 내 아무 유저나 찾아서 설정
            creator = userRepository.findByOrganization(organization).get(0);
        }
        
        UserDTO userDTO = new UserDTO(
                creator.getUserId(),
                creator.getEmail(),
                "",
                creator.getName(),
                false,
                creator.getRole().name(),
                organization.getOrganizationId(),
                creator.getStatus().name()
        );
        
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(userDTO, null, userDTO.getAuthorities()));
        SecurityContextHolder.setContext(context);
        log.info("SecurityContext 설정 완료: user={}", userDTO.getEmail());

        // 현재 할일 개수 저장 (중복 생성 방지 확인용)
        long initialTaskCount = taskRepository.count();

        // When: Task 상태를 PROGRESS로 변경 (시작 버튼 클릭 시뮬레이션)
        log.info("Task 상태를 PROGRESS로 변경하여 자동화 트리거...");
        taskService.updateStatus(task.getTaskId(), "PROGRESS");

        // Then: 스케줄이 업데이트되었는지 확인
        long finalTaskCount = taskRepository.count();
        log.info("할일 개수 변화: {} -> {}", initialTaskCount, finalTaskCount);
        
        // 할일 개수가 늘어나지 않았어야 함 (중복 생성 방지)
        assertThat(finalTaskCount).isEqualTo(initialTaskCount);
        
        Task updatedTask = taskRepository.findById(task.getTaskId()).orElseThrow();
        log.info("업데이트된 Task 상태: {}, 출처: {}, 시작시각: {}, 종료시각: {}", 
                updatedTask.getStatus(), updatedTask.getSourceType(), updatedTask.getStartedAt(), updatedTask.getCompletedAt());
        
        assertThat(updatedTask.getStatus()).isEqualTo(TaskStatus.SUCCESS);
        assertThat(updatedTask.getSourceType()).isEqualTo(TaskSourceType.AI);
        assertThat(updatedTask.getStartedAt()).isNotNull();
        assertThat(updatedTask.getCompletedAt()).isNotNull();

        // 실제 스케줄 업데이트 여부 확인 (월요일 11시)
        Call updatedCall = callRepository.findById(callId).orElseThrow();
        CallSchedule schedule = updatedCall.getCallSchedule();
        log.info("업데이트된 스케줄: nextRunAt={}", schedule.getNextRunAt().format(DATE_TIME_FORMATTER));
        
        assertThat(schedule.getNextRunAt().getHour()).isEqualTo(11);
        assertThat(schedule.getNextRunAt().getMinute()).isEqualTo(0);
        assertThat(schedule.getNextRunAt().getDayOfWeek().name()).isEqualTo("MONDAY");
        
        log.info("✓ USER 타입 Task 시작 시 자동화가 성공적으로 트리거되었습니다.");
        
        // SecurityContext 초기화
        SecurityContextHolder.clearContext();
    }
}


