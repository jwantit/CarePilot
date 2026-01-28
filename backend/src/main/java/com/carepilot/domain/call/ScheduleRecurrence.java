package com.carepilot.domain.call;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ScheduleRecurrence {
    DAILY("일일"),
    WEEKLY("주간"),
    MONTHLY("월간");

    private final String koName;
}
