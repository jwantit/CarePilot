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
    
    // AI 작업 전용 통계
    private Long totalAiTasks;              // 총 AI 작업 수
    private Long successfulAiTasks;          // 성공한 AI 작업 수
    private Long failedAiTasks;              // 실패한 AI 작업 수
    private Double aiSuccessRate;            // AI 작업 성공률
    private Map<String, Long> aiTaskTypeDistribution;    // AI 작업 타입별 분포
    private Map<String, Long> aiTaskStatusDistribution;  // AI 작업 상태별 분포
}

