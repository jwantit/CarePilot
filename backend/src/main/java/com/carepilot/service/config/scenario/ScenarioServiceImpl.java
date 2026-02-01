package com.carepilot.service.config.scenario;

import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.config.scenario.ScenarioDTO;
import com.carepilot.dto.config.scenario.ScenarioQuestionDTO;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.repository.config.ScenarioQuestionRepository;
import com.carepilot.repository.user.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScenarioServiceImpl implements ScenarioService {

    private final ScenarioRepository scenarioRepository;
    private final ScenarioQuestionRepository scenarioQuestionRepository;
    private final CallScheduleRepository callScheduleRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ScenarioDTO> getAllScenarios(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return scenarioRepository.findByOrganization(organization).stream()
                .map(this::toScenarioDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScenarioDTO> getScenariosByFilter(Long organizationId, String status, String riskLevel, String category) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        List<Scenario> scenarios = scenarioRepository.findByOrganization(organization);

        // 필터링
        if (status != null && !status.isEmpty() && !status.equals("전체")) {
            Boolean enabled = status.equals("활성");
            scenarios = scenarios.stream()
                    .filter(s -> s.getEnabled().equals(enabled))
                    .collect(Collectors.toList());
        }

        if (riskLevel != null && !riskLevel.isEmpty() && !riskLevel.equals("전체")) {
            try {
                RiskLevel level = RiskLevel.valueOf(riskLevel.toUpperCase());
                scenarios = scenarios.stream()
                                .filter(s -> s.getRiskLevel() == level)
                                .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // 잘못된 riskLevel 값은 무시
            }
        }

        if (category != null && !category.isEmpty() && !category.equals("전체")) {
            scenarios = scenarios.stream()
                    .filter(s -> category.equals(s.getCategory()))
                    .collect(Collectors.toList());
        }

        return scenarios.stream()
                .map(this::toScenarioDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioDTO getScenarioById(Long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));
        return toScenarioDTO(scenario);
    }

    @Override
    public ScenarioDTO createScenario(Long organizationId, ScenarioDTO dto) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        User createdBy = dto.getCreatedBy() != null
                ? userRepository.findById(dto.getCreatedBy())
                .orElse(null)
                : null;

        Scenario scenario = Scenario.builder()
                .organization(organization)
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .riskLevel(dto.getRiskLevel())
                .enabled(dto.getEnabled() != null ? dto.getEnabled() : true)
                .riskCriteria(dto.getRiskCriteria())
                .createdBy(createdBy)
                .build();

        Scenario saved = scenarioRepository.save(scenario);

        // 질문들 저장
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            List<ScenarioQuestion> questions = dto.getQuestions().stream()
                    .map(q -> ScenarioQuestion.builder()
                            .scenario(saved)
                            .questionText(q.getQuestionText())
                            .questionOrder(q.getQuestionOrder())
                            .isRequired(q.getIsRequired())
                            .build())
                    .collect(Collectors.toList());
            scenarioQuestionRepository.saveAll(questions);
        }

        return toScenarioDTO(saved);
    }

    @Override
    public ScenarioDTO updateScenario(Long scenarioId, ScenarioDTO dto) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));

        scenario.update(
                dto.getName(),
                dto.getDescription(),
                dto.getCategory(),
                dto.getRiskLevel(),
                dto.getEnabled(),
                dto.getRiskCriteria()
        );

        Scenario saved = scenarioRepository.save(scenario);

        // 기존 질문 삭제 후 새로 저장
        scenarioQuestionRepository.deleteByScenario(saved);
        entityManager.flush(); // 삭제 후 flush

        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            List<ScenarioQuestion> questions = dto.getQuestions().stream()
                    .map(q -> ScenarioQuestion.builder()
                            .scenario(saved)
                            .questionText(q.getQuestionText())
                            .questionOrder(q.getQuestionOrder())
                            .isRequired(q.getIsRequired())
                            .build())
                    .collect(Collectors.toList());
            scenarioQuestionRepository.saveAll(questions);
        }

        return toScenarioDTO(saved);
    }

    @Override
    public void deleteScenario(Long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));

        // 1. 관련 CallSchedule의 scenario를 NULL로 설정
        callScheduleRepository.clearScenarioByScenarioId(scenarioId);

        // 2. 질문들 삭제
        scenarioQuestionRepository.deleteByScenario(scenario);

        // 3. 시나리오 삭제
        scenarioRepository.delete(scenario);
    }

    @Override
    public ScenarioDTO updateScenarioEnabledStatus(Long scenarioId, Boolean enabled) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));

        scenario.changeEnabled(enabled);
        Scenario saved = scenarioRepository.save(scenario);
        return toScenarioDTO(saved);
    }

    private ScenarioDTO toScenarioDTO(Scenario scenario) {
        List<ScenarioQuestion> questions = scenarioQuestionRepository.findByScenarioOrderByQuestionOrderAsc(scenario);

        List<ScenarioQuestionDTO> questionDTOs = questions.stream()
                .map(q -> ScenarioQuestionDTO.builder()
                        .questionId(q.getQuestionId())
                        .scenarioId(scenario.getScenarioId())
                        .questionText(q.getQuestionText())
                        .questionOrder(q.getQuestionOrder())
                        .isRequired(q.getIsRequired())
                        .build())
                .collect(Collectors.toList());

        String status = scenario.getEnabled() ? "활성" : "비활성";

        return ScenarioDTO.builder()
                .scenarioId(scenario.getScenarioId())
                .organizationId(scenario.getOrganization().getOrganizationId())
                .name(scenario.getName())
                .description(scenario.getDescription())
                .category(scenario.getCategory())
                .riskLevel(scenario.getRiskLevel())
                .enabled(scenario.getEnabled())
                .riskCriteria(scenario.getRiskCriteria())
                .createdBy(scenario.getCreatedBy() != null ? scenario.getCreatedBy().getUserId() : null)
                .status(status)
                .questions(questionDTOs)
                .build();
    }
}
