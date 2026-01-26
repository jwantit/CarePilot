package com.carepilot.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConfigDTO {
    private Long aiConfigId;
    private Long organizationId;
    private String featureName;
    private Boolean isEnabled;
    private String configValue;
}