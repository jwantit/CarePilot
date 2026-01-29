package com.carepilot.dto.callanalysis;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RiskAnalysisResultDTO {
    private final Integer riskScore;
}
