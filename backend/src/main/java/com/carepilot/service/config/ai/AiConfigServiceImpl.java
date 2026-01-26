package com.carepilot.service.config.ai;

import com.carepilot.domain.config.AIConfig;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.config.AIConfigDTO;
import com.carepilot.repository.config.AIConfigRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AiConfigServiceImpl implements AiConfigService {

    private final AIConfigRepository aiConfigRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public AIConfigDTO getAIConfig(Long organizationId, String featureName) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        AIConfig config = aiConfigRepository.findByOrganizationAndFeatureName(organization, featureName)
                .orElse(AIConfig.builder()
                        .organization(organization)
                        .featureName(featureName)
                        .isEnabled(false)
                        .build());

        return AIConfigDTO.builder()
                .aiConfigId(config.getAiConfigId())
                .organizationId(organization.getOrganizationId())
                .featureName(config.getFeatureName())
                .isEnabled(config.getIsEnabled())
                .configValue(config.getConfigValue())
                .build();
    }

    @Override
    public AIConfigDTO updateAIConfig(Long organizationId, String featureName, Boolean isEnabled) {

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        AIConfig config = aiConfigRepository.findByOrganizationAndFeatureName(organization, featureName)
                .orElseGet(() -> AIConfig.builder()
                        .organization(organization)
                        .featureName(featureName)
                        .isEnabled(false)
                        .build());

        // 기존 엔티티 값만 변경
        config.changeEnabled(isEnabled);

        // save 안 해도 되지만 명시적으로 둬도 됨
        AIConfig saved = aiConfigRepository.save(config);

        return AIConfigDTO.builder()
                .aiConfigId(saved.getAiConfigId())
                .organizationId(organization.getOrganizationId())
                .featureName(saved.getFeatureName())
                .isEnabled(saved.getIsEnabled())
                .configValue(saved.getConfigValue())
                .build();
    }
}
