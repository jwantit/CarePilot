package com.carepilot.service.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.CallType;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.ScenarioQuestionRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.call.context.ConversationContextService;
import com.carepilot.service.call.emergency.EmergencyDetectionResult;
import com.carepilot.service.call.emergency.EmergencyDetectionService;
import com.carepilot.service.call.generation.QuestionGenerationService;
import com.carepilot.service.call.vector.CallVectorStoreService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 통화 사이클 전체 테스트
 * 
 * 테스트 내용:
 * 1. 첫 번째 질문 처리
 * 2. 답변 수신 → 긴급 상황 감지 → 벡터 저장
 * 3. 과거 기록 검색 → 컨텍스트 조립
 * 4. 동적 질문 생성 (LLM)
 * 5. 긴급 상황 감지 테스트
 * 
 * @ActiveProfiles("test") - 테스트 환경에서는 Mock VectorStore 사용 (Redis 불필요)
 * 
 * 실제 전화 없이 내부 로직만 테스트합니다.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Commit
@Log4j2
class ConversationCycleTests {

    @Autowired
    private CallVectorStoreService callVectorStoreService;
    
    @Autowired
    private EmergencyDetectionService emergencyDetectionService;
    
    @Autowired
    private ConversationContextService contextService;
    
    @Autowired
    private QuestionGenerationService questionGenerationService;
    
    @Autowired
    private CallRepository callRepository;
    
    @Autowired
    private CallScheduleRepository callScheduleRepository;
    
    @Autowired
    private CareTargetRepository careTargetRepository;
    
    @Autowired
    private ScenarioRepository scenarioRepository;
    
    @Autowired
    private ScenarioQuestionRepository scenarioQuestionRepository;
    
    @Autowired
    private OrganizationRepository organizationRepository;
    
    @Autowired
    private UserRepository userRepository;

    private CareTarget testCareTarget;
    private Scenario testScenario;
    private Call testCall;
    private List<ScenarioQuestion> testQuestions;

    @BeforeEach
    void setUp() {
        // 테스트용 데이터 준비
        Organization org = organizationRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Organization이 없습니다. 먼저 생성해주세요."));
        
        // CareTarget ID 3L로 지정
        testCareTarget = careTargetRepository.findById(3L)
                .orElseThrow(() -> new RuntimeException("CareTarget ID 3이 없습니다. 먼저 생성해주세요."));
        
        User testUser = userRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        
        // 기존 시나리오 찾기 또는 생성 (중복 생성 방지)
        String testScenarioName = "일상 건강 체크 (테스트용)";
        testScenario = scenarioRepository.findByOrganization(org).stream()
                .filter(s -> testScenarioName.equals(s.getName()))
                .findFirst()
                .orElse(null);
        
        if (testScenario == null) {
            // 시나리오가 없으면 생성
            testScenario = Scenario.builder()
                    .organization(org)
                    .name(testScenarioName)
                    .description("매일 환자의 기본적인 건강 상태를 확인하는 시나리오입니다.")
                    .category("건강관리")
                    .riskLevel(RiskLevel.LOW)
                    .enabled(true)
                    .riskCriteria("기본 건강 지표 이상 시 알림")
                    .createdBy(testUser)
                    .build();
            testScenario = scenarioRepository.save(testScenario);
            log.info("새로운 테스트 시나리오 생성: ID={}", testScenario.getScenarioId());
            
            // 질문 생성 (시나리오가 새로 생성된 경우에만)
            List<String> questionTexts = List.of(
                    "식사는 하셨나요?",
                    "오늘 컨디션은 어떠신가요?",
                    "약은 제대로 드셨나요?"
            );
            
            for (int i = 0; i < questionTexts.size(); i++) {
                ScenarioQuestion question = ScenarioQuestion.builder()
                        .scenario(testScenario)
                        .questionText(questionTexts.get(i))
                        .questionOrder(i + 1)
                        .isRequired(true)
                        .build();
                scenarioQuestionRepository.save(question);
            }
        } else {
            log.info("기존 테스트 시나리오 재사용: ID={}", testScenario.getScenarioId());
        }
        
        testQuestions = scenarioQuestionRepository.findByScenarioOrderByQuestionOrderAsc(testScenario);
        
        // CallSchedule 생성
        CallSchedule schedule = CallSchedule.builder()
                .organization(org)
                .targetType(ScheduleTargetType.CARE_TARGET)
                .careTarget(testCareTarget)
                .scheduledTime(LocalDateTime.now())
                .type(ScheduleType.ONE_TIME)
                .status(ScheduleStatus.SCHEDULED)
                .scenario(testScenario)
                .build();
        schedule = callScheduleRepository.save(schedule);
        
        // Call 생성
        testCall = Call.builder()
                .organization(org)
                .careTarget(testCareTarget)
                .callSchedule(schedule)
                .direction(CallDirection.OUTBOUND)
                .callType(CallType.REGULAR_MONITORING)
                .status(CallStatus.NO_ANSWER)
                .startTime(LocalDateTime.now())
                .callerId(testCareTarget.getTargetPhone())
                .callSid("TEST_" + UUID.randomUUID().toString())
                .build();
        testCall = callRepository.save(testCall);
        
        log.info("=== 테스트 데이터 준비 완료 ===");
        log.info("CareTarget ID: {}", testCareTarget.getCareTargetId());
        log.info("Scenario ID: {}", testScenario.getScenarioId());
        log.info("Call ID: {}", testCall.getCallId());
        log.info("질문 개수: {}", testQuestions.size());
    }

    @Test
    @DisplayName("전체 통화 사이클 테스트 - 정상 케이스")
    void testFullConversationCycle() {
        log.info("\n\n========================================");
        log.info("=== 전체 통화 사이클 테스트 시작 ===");
        log.info("========================================\n");
        
        String callSid = testCall.getCallSid();
        int questionIdx = 0;
        
        // ===== 1단계: 첫 번째 질문 =====
        log.info("【1단계】 첫 번째 질문");
        ScenarioQuestion firstQuestion = testQuestions.get(0);
        log.info("질문: {}", firstQuestion.getQuestionText());
        log.info("questionIdx: {}", questionIdx);
        log.info("");
        
        // ===== 2단계: 첫 번째 답변 수신 =====
        questionIdx = 1;
        String firstAnswer = "아니, 입맛이 없어서 대충 때웠어.";
        log.info("【2단계】 첫 번째 답변 수신");
        log.info("답변: {}", firstAnswer);
        log.info("questionIdx: {}", questionIdx);
        
        // 2-1. 긴급 상황 감지
        String scenarioPurpose = testScenario.getDescription();
        EmergencyDetectionResult emergencyResult = emergencyDetectionService.detectEmergency(
                firstAnswer, scenarioPurpose);
        log.info("긴급 상황 감지 결과: {}", emergencyResult.isEmergency() ? "긴급" : "정상");
        if (emergencyResult.isEmergency()) {
            log.info("긴급 메시지: {}", emergencyResult.getEmergencyMessage());
        }
        log.info("");
        
        // 2-2. 답변 저장 및 벡터 저장
        callVectorStoreService.saveAnswerVector(
                testCareTarget.getCareTargetId(),
                firstQuestion.getQuestionText(),
                firstAnswer,
                null,
                LocalDateTime.now()
        );
        log.info("벡터 저장 완료: 질문={}, 답변={}", firstQuestion.getQuestionText(), firstAnswer);
        log.info("");
        
        // ===== 3단계: 두 번째 질문 생성 (과거 기록 검색 + 질문 변형) =====
        log.info("【3단계】 두 번째 질문 생성");
        ScenarioQuestion secondQuestion = testQuestions.get(1);
        String originalQuestion = secondQuestion.getQuestionText();
        log.info("원래 질문: {}", originalQuestion);
        
        // 3-1. 과거 기록 검색
        String context = contextService.buildContext(testCareTarget, firstAnswer, 3);
        log.info("과거 기록 검색 결과:");
        if (context.isEmpty()) {
            log.info("  - 검색된 기록 없음 (벡터DB에 데이터가 없을 수 있음)");
        } else {
            log.info("{}", context);
        }
        log.info("");
        
        // 3-2. 동적 질문 생성
        String contextualQuestion = questionGenerationService.generateContextualQuestion(
                originalQuestion,
                testCareTarget,
                firstAnswer
        );
        log.info("변형된 질문: {}", contextualQuestion);
        log.info("");
        
        // ===== 4단계: 두 번째 답변 수신 =====
        questionIdx = 2;
        String secondAnswer = "머리가 좀 지끈거리네.";
        log.info("【4단계】 두 번째 답변 수신");
        log.info("답변: {}", secondAnswer);
        log.info("questionIdx: {}", questionIdx);
        
        // 4-1. 긴급 상황 감지
        EmergencyDetectionResult emergencyResult2 = emergencyDetectionService.detectEmergency(
                secondAnswer, scenarioPurpose);
        log.info("긴급 상황 감지 결과: {}", emergencyResult2.isEmergency() ? "긴급" : "정상");
        log.info("");
        
        // 4-2. 벡터 저장
        callVectorStoreService.saveAnswerVector(
                testCareTarget.getCareTargetId(),
                contextualQuestion,
                secondAnswer,
                null,
                LocalDateTime.now()
        );
        log.info("벡터 저장 완료: 질문={}, 답변={}", contextualQuestion, secondAnswer);
        log.info("");
        
        // ===== 5단계: 세 번째 질문 생성 =====
        log.info("【5단계】 세 번째 질문 생성");
        ScenarioQuestion thirdQuestion = testQuestions.get(2);
        String originalQuestion3 = thirdQuestion.getQuestionText();
        log.info("원래 질문: {}", originalQuestion3);
        
        // 과거 기록 검색 (이제 두 개의 답변이 저장되어 있음)
        String context2 = contextService.buildContext(testCareTarget, secondAnswer, 3);
        log.info("과거 기록 검색 결과:");
        if (context2.isEmpty()) {
            log.info("  - 검색된 기록 없음");
        } else {
            log.info("{}", context2);
        }
        
        // 동적 질문 생성
        String contextualQuestion3 = questionGenerationService.generateContextualQuestion(
                originalQuestion3,
                testCareTarget,
                secondAnswer
        );
        log.info("변형된 질문: {}", contextualQuestion3);
        log.info("");
        
        log.info("========================================");
        log.info("=== 전체 통화 사이클 테스트 완료 ===");
        log.info("========================================\n");
    }

    @Test
    @DisplayName("긴급 상황 감지 테스트")
    void testEmergencyDetection() {
        log.info("\n\n========================================");
        log.info("=== 긴급 상황 감지 테스트 시작 ===");
        log.info("========================================\n");
        
        String scenarioPurpose = testScenario.getDescription();
        
        // 정상 답변 테스트
        String normalAnswer = "네, 오늘은 괜찮아요.";
        EmergencyDetectionResult result1 = emergencyDetectionService.detectEmergency(
                normalAnswer, scenarioPurpose);
        log.info("정상 답변 테스트");
        log.info("답변: {}", normalAnswer);
        log.info("결과: {}", result1.isEmergency() ? "긴급" : "정상");
        log.info("");
        
        // 긴급 답변 테스트
        String emergencyAnswer = "머리가 깨질 것 같이 아파. 죽을 것 같아.";
        EmergencyDetectionResult result2 = emergencyDetectionService.detectEmergency(
                emergencyAnswer, scenarioPurpose);
        log.info("긴급 답변 테스트");
        log.info("답변: {}", emergencyAnswer);
        log.info("결과: {}", result2.isEmergency() ? "긴급" : "정상");
        if (result2.isEmergency()) {
            log.info("긴급 메시지: {}", result2.getEmergencyMessage());
        }
        log.info("");
        
        // 경미한 증상 테스트
        String mildAnswer = "조금 아프긴 한데 참을 만해요.";
        EmergencyDetectionResult result3 = emergencyDetectionService.detectEmergency(
                mildAnswer, scenarioPurpose);
        log.info("경미한 증상 테스트");
        log.info("답변: {}", mildAnswer);
        log.info("결과: {}", result3.isEmergency() ? "긴급" : "정상");
        log.info("");
        
        log.info("========================================");
        log.info("=== 긴급 상황 감지 테스트 완료 ===");
        log.info("========================================\n");
    }

    @Test
    @DisplayName("과거 기록 검색 및 컨텍스트 조립 테스트")
    void testContextSearch() {
        log.info("\n\n========================================");
        log.info("=== 과거 기록 검색 테스트 시작 ===");
        log.info("========================================\n");
        
        // 테스트용 답변
        String testAnswer = "입맛이 없어서 잘 안 먹어요.";
        
        log.info("검색 쿼리: {}", testAnswer);
        log.info("CareTarget ID: {}", testCareTarget.getCareTargetId());
        log.info("");
        
        // 컨텍스트 검색
        String context = contextService.buildContext(testCareTarget, testAnswer, 3);
        
        log.info("검색 결과:");
        if (context.isEmpty()) {
            log.info("  - 검색된 기록 없음");
            log.info("  - 벡터DB에 데이터가 없거나 유사한 기록이 없을 수 있습니다.");
            log.info("  - VectorStoreServiceTests.insertSampleVectorData()를 먼저 실행해주세요.");
        } else {
            log.info("{}", context);
        }
        log.info("");
        
        log.info("========================================");
        log.info("=== 과거 기록 검색 테스트 완료 ===");
        log.info("========================================\n");
    }
}

