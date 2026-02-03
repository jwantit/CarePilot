package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskStatisticsDTO {
    // 위험 레벨별 분포
    private Map<String, Long> riskLevelDistribution;
    
    // 위험 시그널 Top N
    private List<RiskSignalCountDTO> topRiskSignals;
    
    // 위험 점수 추이
    private List<RiskScoreTrendDTO> riskScoreTrend;
    
    // 평균 위험 점수
    private Double avgRiskScore;
}

