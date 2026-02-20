package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeDTO {
    private Double value; // 변화율 또는 변화량
    private String type; // "increase" 또는 "decrease"
}

