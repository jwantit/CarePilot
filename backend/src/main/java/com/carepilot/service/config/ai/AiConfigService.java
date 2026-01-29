package com.carepilot.service.config.ai;

import com.carepilot.dto.config.AIConfigDTO;

public interface AiConfigService {
    AIConfigDTO getAIConfig(Long organizationId, String featureName);
    AIConfigDTO updateAIConfig(Long organizationId, String featureName, Boolean isEnabled);
}

