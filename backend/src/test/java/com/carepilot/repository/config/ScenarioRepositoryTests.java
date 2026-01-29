package com.carepilot.repository.config;

import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Rollback(false)  // 실제 DB에 저장하려면 false, 롤백하려면 true
@Log4j2
public class ScenarioRepositoryTests {

    @Autowired
    private ScenarioRepository scenarioRepository;
    
    @Autowired
    private ScenarioQuestionRepository scenarioQuestionRepository;
    
    @Autowired
    private OrganizationRepository organizationRepository;
    
    @Autowired
    private UserRepository userRepository;

    private Organization testOrg;
    private User testUser;

    @BeforeEach
    void setUp() {
        // 테스트용 Organization 생성
        testOrg = organizationRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    Organization org = Organization.builder()
                            .name("테스트 병원")
                            .organizationNumber("TEST-001")
                            .build();
                    return organizationRepository.save(org);
                });

        // 테스트용 User 생성 (없으면 null로 진행)
        List<User> users = userRepository.findByOrganization(testOrg);
        testUser = users.isEmpty() ? null : users.get(0);
    }

    @Test
    @DisplayName("시나리오와 질문 더미 데이터 생성")
    void createScenarioWithQuestions() {
        // 시나리오 1: 일상 건강 체크
        Scenario healthCheckScenario = createScenario(
                "일상 건강 체크",
                "매일 환자의 기본적인 건강 상태를 확인하는 시나리오입니다.",
                "건강관리",
                RiskLevel.LOW,
                true,
                "기본 건강 지표 이상 시 알림"
        );

        createQuestionsForScenario(healthCheckScenario, Arrays.asList(
                "오늘 컨디션이 어떠신가요?",
                "통증이나 불편함이 있으신가요?",
                "약물을 정상적으로 복용하셨나요?",
                "수면은 잘 주무셨나요?",
                "식사는 잘 하셨나요?"
        ));

        // 시나리오 2: 긴급 상황 체크
        Scenario emergencyScenario = createScenario(
                "긴급 상황 체크",
                "환자의 긴급한 건강 이상 징후를 확인하는 시나리오입니다.",
                "응급상황",
                RiskLevel.CRITICAL,
                true,
                "긴급 증상 발견 시 즉시 알림"
        );

        createQuestionsForScenario(emergencyScenario, Arrays.asList(
                "지금 몸에 이상이 있으신가요?",
                "호흡이 어려우신가요?",
                "가슴 통증이 있으신가요?",
                "의식이 명확하신가요?",
                "도움이 필요하신가요?"
        ));

        // 시나리오 3: 만성질환 관리
        Scenario chronicDiseaseScenario = createScenario(
                "만성질환 관리",
                "당뇨, 고혈압 등 만성질환 환자의 상태를 점검하는 시나리오입니다.",
                "만성질환",
                RiskLevel.MEDIUM,
                true,
                "혈당/혈압 수치 이상 시 알림"
        );

        createQuestionsForScenario(chronicDiseaseScenario, Arrays.asList(
                "오늘 혈당을 측정하셨나요?",
                "혈당 수치는 얼마였나요?",
                "혈압을 측정하셨나요?",
                "혈압 수치는 얼마였나요?",
                "약물 복용은 정상적으로 하셨나요?"
        ));

        // 시나리오 4: 복약 관리
        Scenario medicationScenario = createScenario(
                "복약 관리",
                "환자의 약물 복용 상태를 확인하는 시나리오입니다.",
                "복약관리",
                RiskLevel.LOW,
                true,
                "복약 누락 시 알림"
        );

        createQuestionsForScenario(medicationScenario, Arrays.asList(
                "아침 약을 복용하셨나요?",
                "점심 약을 복용하셨나요?",
                "저녁 약을 복용하셨나요?",
                "약물 복용 후 이상 증상이 있으신가요?"
        ));

        // 시나리오 5: 수면 관리
        Scenario sleepScenario = createScenario(
                "수면 관리",
                "환자의 수면 패턴과 질을 확인하는 시나리오입니다.",
                "수면관리",
                RiskLevel.LOW,
                true,
                "수면 장애 시 알림"
        );

        createQuestionsForScenario(sleepScenario, Arrays.asList(
                "어제 밤 몇 시간 주무셨나요?",
                "수면의 질은 어떠셨나요?",
                "잠에 잘 드셨나요?",
                "중간에 깨어나신 적이 있나요?",
                "오늘 낮에 졸리신가요?"
        ));

        // 검증
        List<Scenario> allScenarios = scenarioRepository.findByOrganization(testOrg);
        assertThat(allScenarios).isNotEmpty();
        
        log.info("생성된 시나리오 수: {}", allScenarios.size());
        allScenarios.forEach(scenario -> {
            List<ScenarioQuestion> questions = scenarioQuestionRepository
                    .findByScenarioOrderByQuestionOrderAsc(scenario);
            log.info("시나리오: {} (질문 수: {})", scenario.getName(), questions.size());
        });
    }

    private Scenario createScenario(String name, String description, String category,
                                   RiskLevel riskLevel, Boolean enabled, String riskCriteria) {
        Scenario scenario = Scenario.builder()
                .organization(testOrg)
                .name(name)
                .description(description)
                .category(category)
                .riskLevel(riskLevel)
                .enabled(enabled)
                .riskCriteria(riskCriteria)
                .createdBy(testUser)
                .build();

        Scenario saved = scenarioRepository.save(scenario);
        log.info("시나리오 생성: scenarioId={}, name={}, category={}, riskLevel={}",
                saved.getScenarioId(), saved.getName(), saved.getCategory(), saved.getRiskLevel());
        
        return saved;
    }

    private void createQuestionsForScenario(Scenario scenario, List<String> questionTexts) {
        for (int i = 0; i < questionTexts.size(); i++) {
            ScenarioQuestion question = ScenarioQuestion.builder()
                    .scenario(scenario)
                    .questionText(questionTexts.get(i))
                    .questionOrder(i + 1)
                    .isRequired(i < 3)  // 처음 3개 질문은 필수로 설정
                    .build();

            ScenarioQuestion saved = scenarioQuestionRepository.save(question);
            log.info("질문 생성: questionId={}, order={}, text={}, required={}",
                    saved.getQuestionId(), saved.getQuestionOrder(), 
                    saved.getQuestionText(), saved.getIsRequired());
        }
    }
}

