package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponseDTO {
    private SummaryDTO summary;
    private CallStatisticsDTO callStatistics;
    private RiskStatisticsDTO riskStatistics;
    private TaskStatisticsDTO taskStatistics;
}

