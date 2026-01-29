package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskTrendDTO {
    private int score;
    private String date;
}
