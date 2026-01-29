package com.carepilot.dto.caretarget.caretargetgroup;


//import com.carepilot.domain.enums.Priority;
//import com.carepilot.domain.enums.ScheduleRecurrence;
//import com.carepilot.domain.enums.ScheduleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareGroupCallScheduleResponseDTO {
    private Long scheduleId;
    private String scheduledTime; //예약 시작일
    private String type; ////ONE_TIME 일회성 / RECURRING 반복
    private String recurrence;//DAILY(일), WEEKLY(주), MONTHLY(월)
    private String scheduleStatus; //SCHEDULED("예약됨"), COMPLETED("완료됨"), CANCELLED("취소됨"), FAILED("실패");
    private String recurrenceEndDate;//(선택)반복 종료일
    private String priority; // 우선도
    private String memo;
}

