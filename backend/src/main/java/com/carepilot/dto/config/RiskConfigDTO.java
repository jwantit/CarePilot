package com.carepilot.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskConfigDTO {
    private Long riskConfigId;
    private Long organizationId;
    private Integer criticalThreshold;
    private Integer highThreshold;
    private Integer mediumThreshold;
    private Integer lowThreshold;
}


