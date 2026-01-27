package com.carepilot.dto.call;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleUpdateRequestDTO {
    private Long careTargetId;
    private LocalDateTime scheduledTime;
    private String type;
    private String priority;
    private String recurrence;
    private LocalDateTime recurrenceEndDate;
    private String memo;
}

