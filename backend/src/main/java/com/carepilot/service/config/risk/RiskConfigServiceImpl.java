package com.carepilot.service.config.risk;

import com.carepilot.domain.config.RiskConfig;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.config.RiskConfigDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.config.RiskConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RiskConfigServiceImpl implements RiskConfigService {

    private final RiskConfigRepository riskConfigRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public RiskConfigDTO getRiskConfig(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        RiskConfig config = riskConfigRepository.findByOrganization(organization)
                .orElse(RiskConfig.builder()
                        .organization(organization)
                        .criticalThreshold(90)
                        .highThreshold(70)
                        .mediumThreshold(50)
                        .lowThreshold(30)
                        .build());

        return RiskConfigDTO.builder()
                .riskConfigId(config.getRiskConfigId())
                .organizationId(organization.getOrganizationId())
                .criticalThreshold(config.getCriticalThreshold())
                .highThreshold(config.getHighThreshold())
                .mediumThreshold(config.getMediumThreshold())
                .lowThreshold(config.getLowThreshold())
                .build();
    }

    @Override
    public RiskConfigDTO updateRiskConfig(Long organizationId, RiskConfigDTO dto) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        RiskConfig config = riskConfigRepository.findByOrganization(organization)
                .orElseGet(() -> RiskConfig.builder()
                        .organization(organization)
                        .criticalThreshold(90)
                        .highThreshold(70)
                        .mediumThreshold(50)
                        .lowThreshold(30)
                        .build());

        config.updateThresholds(
                dto.getCriticalThreshold(),
                dto.getHighThreshold(),
                dto.getMediumThreshold(),
                dto.getLowThreshold()
        );

        RiskConfig saved = riskConfigRepository.save(config);

        return RiskConfigDTO.builder()
                .riskConfigId(saved.getRiskConfigId())
                .organizationId(organization.getOrganizationId())
                .criticalThreshold(saved.getCriticalThreshold())
                .highThreshold(saved.getHighThreshold())
                .mediumThreshold(saved.getMediumThreshold())
                .lowThreshold(saved.getLowThreshold())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RiskLevel resolveLevel(Integer riskScore, RiskConfigDTO config) {
        if (riskScore == null) return RiskLevel.LOW;
        int critical = config.getCriticalThreshold() != null ? config.getCriticalThreshold() : 90;
        int high = config.getHighThreshold() != null ? config.getHighThreshold() : 70;
        int medium = config.getMediumThreshold() != null ? config.getMediumThreshold() : 50;
        if (riskScore >= critical) return RiskLevel.CRITICAL;
        if (riskScore >= high) return RiskLevel.HIGH;
        if (riskScore >= medium) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
}
