package com.carepilot.service.config.risk;

import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.dto.config.RiskConfigDTO;

public interface RiskConfigService {
    RiskConfigDTO getRiskConfig(Long organizationId);
    RiskConfigDTO updateRiskConfig(Long organizationId, RiskConfigDTO dto);

    /** risk_score(숫자)와 org별 임계값으로 RiskLevel 계산 */
    RiskLevel resolveLevel(Integer riskScore, RiskConfigDTO config);
}

