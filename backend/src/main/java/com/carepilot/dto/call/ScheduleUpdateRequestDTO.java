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
    private Long careTargetId;  // 개인 대상자 (targetType이 CARE_TARGET일 때)
    private Long groupId;        // 그룹 (targetType이 GROUP일 때)
    private Long scenarioId;    // 선택 시나리오 (통화 시 사용)
    private LocalDateTime scheduledTime;
    private String type;
    private String priority;
    private String recurrence;
    private LocalDateTime recurrenceEndDate;
    private String memo;
}

