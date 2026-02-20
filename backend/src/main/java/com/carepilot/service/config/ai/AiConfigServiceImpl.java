package com.carepilot.service.config.ai;

import com.carepilot.domain.config.AIConfig;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.config.AIConfigDTO;
import com.carepilot.repository.config.AIConfigRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class AiConfigServiceImpl implements AiConfigService {

    private final AIConfigRepository aiConfigRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public AIConfigDTO getAIConfig(Long organizationId, String featureName) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        java.util.Optional<AIConfig> configOpt = aiConfigRepository.findByOrganizationAndFeatureName(organization, featureName);
        
        if (configOpt.isPresent()) {
            AIConfig found = configOpt.get();
            log.info("AIConfig 조회 성공: organizationId={}, featureName={}, isEnabled={}, aiConfigId={}", 
                    organizationId, featureName, found.getIsEnabled(), found.getAiConfigId());
            
            return AIConfigDTO.builder()
                    .aiConfigId(found.getAiConfigId())
                    .organizationId(organization.getOrganizationId())
                    .featureName(found.getFeatureName())
                    .isEnabled(found.getIsEnabled())
                    .configValue(found.getConfigValue())
                    .build();
        } else {
            // 설정이 없으면 자동으로 생성 (별도 트랜잭션으로 저장)
            log.warn("AIConfig가 없어 자동 생성: organizationId={}, featureName={}", organizationId, featureName);
            
            // 디버깅: DB에 있는 모든 설정 확인
            java.util.List<AIConfig> allConfigs = aiConfigRepository.findAll();
            log.info("DB에 저장된 모든 AIConfig (총 {}개):", allConfigs.size());
            allConfigs.forEach(c -> {
                if (c.getOrganization().getOrganizationId().equals(organizationId)) {
                    log.info("  - organizationId={}, featureName={}, isEnabled={}, aiConfigId={}", 
                            c.getOrganization().getOrganizationId(), 
                            c.getFeatureName(), 
                            c.getIsEnabled(),
                            c.getAiConfigId());
                }
            });
            
            return createDefaultConfig(organizationId, featureName);
        }
    }
    
    /**
     * 기본 설정 생성 (별도 트랜잭션으로 저장)
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    private AIConfigDTO createDefaultConfig(Long organizationId, String featureName) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        // 다시 한 번 확인 (동시성 문제 방지)
        java.util.Optional<AIConfig> existing = aiConfigRepository.findByOrganizationAndFeatureName(organization, featureName);
        if (existing.isPresent()) {
            AIConfig found = existing.get();
            return AIConfigDTO.builder()
                    .aiConfigId(found.getAiConfigId())
                    .organizationId(organization.getOrganizationId())
                    .featureName(found.getFeatureName())
                    .isEnabled(found.getIsEnabled())
                    .configValue(found.getConfigValue())
                    .build();
        }
        
        // 새로 생성
        AIConfig newConfig = AIConfig.builder()
                .organization(organization)
                .featureName(featureName)
                .isEnabled(false)  // 기본값은 false
                .build();
        
        AIConfig saved = aiConfigRepository.save(newConfig);
        log.info("AIConfig 자동 생성 완료: organizationId={}, featureName={}, aiConfigId={}", 
                organizationId, featureName, saved.getAiConfigId());
        
        return AIConfigDTO.builder()
                .aiConfigId(saved.getAiConfigId())
                .organizationId(organization.getOrganizationId())
                .featureName(saved.getFeatureName())
                .isEnabled(saved.getIsEnabled())
                .configValue(saved.getConfigValue())
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
