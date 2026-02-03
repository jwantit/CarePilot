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
public class CallStatisticsDTO {
    // 통화 추이 (일별/주별/월별)
    private List<TrendDataDTO> trend;
    
    // 통화 상태별 분포
    private Map<String, Long> statusDistribution;
    
    // 통화 방향별 분포
    private Map<String, Long> directionDistribution;
    
    // 시간대별 통화 분포 (0-23시)
    private Map<Integer, Long> timeSlotDistribution;
    
    // 평균 통화 시간 (초)
    private Double avgDuration;
}

