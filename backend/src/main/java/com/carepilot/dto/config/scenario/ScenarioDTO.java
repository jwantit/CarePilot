package com.carepilot.dto.config.scenario;

import com.carepilot.domain.notification.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioDTO {
    private Long scenarioId;
    private Long organizationId;
    private String name;
    private String description;
    private String category;
    private RiskLevel riskLevel;
    private Boolean enabled;
    private String riskCriteria;
    private Long createdBy;
    private String status; // ACTIVE, DRAFT 등
    private List<ScenarioQuestionDTO> questions;
}

