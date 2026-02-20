package com.carepilot.dto.caretarget.caretargetgroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CallScheduleListDTO {
    private Long scheduleId;
    private String priority; //우선순위 Low MEDIUM, MEDIUM, URGENT
    private String scheduleStatus; //예약됨/완료됨/취소됨/실패
    private String memo; //메모
    private String createdByScheduleUserName; //담당자
    private String scheduledTime; //예약시간
}
