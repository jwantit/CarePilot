package com.carepilot.dto.caretarget.caretargetgroup;


import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.enums.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareGroupScheduleRequestDTO {
    //id 들
    private Long organizationId;
    private Long groupId;
    private Long scheduleId;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    private String scheduledTime; //예약 시작일
    private ScheduleType type; //ONE_TIME 일회성 / RECURRING 반복
    private ScheduleRecurrence recurrence; //DAILY(일), WEEKLY(주), MONTHLY(월)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    private String recurrenceEndDate; //(선택)반복 종료일
    private Priority priority; //LOW, MEDIUM, HIGH, URGENT
    private String memo;
}
