package com.carepilot.domain.call;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ScheduleStatus {
    SCHEDULED("예약됨"),
    RUNNING("실행중"),
    COMPLETED("완료됨"),
    CANCELLED("취소됨"),
    FAILED("실패");

    private final String koName;
}

