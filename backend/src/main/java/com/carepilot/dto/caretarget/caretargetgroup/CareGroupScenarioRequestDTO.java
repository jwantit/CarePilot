package com.carepilot.dto.caretarget.caretargetgroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareGroupScenarioRequestDTO {
    private Long scenarioId;
    private String scenarioName;
    private String scenarioDescription;
}
