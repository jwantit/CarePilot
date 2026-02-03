package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatisticsDTO {
    // 작업 상태별 분포
    private Map<String, Long> statusDistribution;
    
    // 작업 우선순위별 분포
    private Map<String, Long> priorityDistribution;
    
    // 작업 소스 타입별 분포
    private Map<String, Long> sourceTypeDistribution;
    
    // 완료율
    private Double completionRate;
}

