package com.carepilot.dto.call;

import com.carepilot.domain.call.CallSchedule;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScheduleResponseDTO {
    private Long scheduleId;
    private String scheduledTime;
    private String careTargetName;
    private String type;         // 인희성, 반복 등
    private String priority;     // 높음(Orange), 보통(Blue), 긴급(Red)
    private String status;       // 예약됨
    private String recurrence;   // 반복 주기 (weekly, daily)

    public static ScheduleResponseDTO from(CallSchedule schedule) {
        return ScheduleResponseDTO.builder()
                .scheduleId(schedule.getScheduleId())
                .scheduledTime(schedule.getScheduledTime().toString())
                .careTargetName(schedule.getCareTarget() != null ? schedule.getCareTarget().getName() : "그룹대상")
                .type(schedule.getType().name())
                .priority(schedule.getPriority().name())
                .status(schedule.getStatus().name())
                .recurrence(schedule.getRecurrence() != null ? schedule.getRecurrence().name() : "단발")
                .build();
    }
}
