package com.carepilot.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDataDTO {
    private LocalDate date;
    private Long total;
    private Long success;
    private Long failed;
    private Long noAnswer;
}

