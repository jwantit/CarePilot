package com.carepilot.service.config.risk;

import com.carepilot.dto.config.RiskConfigDTO;

public interface RiskConfigService {
    RiskConfigDTO getRiskConfig(Long organizationId);
    RiskConfigDTO updateRiskConfig(Long organizationId, RiskConfigDTO dto);
}

