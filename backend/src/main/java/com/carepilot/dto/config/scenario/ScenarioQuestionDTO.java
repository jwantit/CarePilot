package com.carepilot.dto.config.scenario;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioQuestionDTO {
    private Long questionId;
    private Long scenarioId;
    private String questionText;
    private Integer questionOrder;
    private Boolean isRequired;
}

