package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryDTO {
    private Long totalCalls;
    private Double successRate;
    private Long riskPatients;
    private Double avgRiskScore;
    private Long activeNotifications;
    private Long completedTasks;
    
    // 전월 대비 변화율
    private ChangeDTO totalCallsChange;
    private ChangeDTO successRateChange;
    private ChangeDTO riskPatientsChange;
    private ChangeDTO avgRiskScoreChange;
}

