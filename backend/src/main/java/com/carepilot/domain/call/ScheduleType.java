package com.carepilot.domain.call;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ScheduleType {
    ONE_TIME("일회성"),
    RECURRING("반복");

    private final String koName;
}

