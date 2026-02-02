package com.carepilot.dto.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.user.User;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.organization.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleCreateRequestDTO {
    private Long organizationId;
    private Long careTargetId;
    private Long scenarioId;    // 선택 시나리오 (통화 시 사용)
    private LocalDateTime scheduledTime;
    private String type;         // ScheduleType Enum 매핑용
    private String priority;     // Priority Enum 매핑용
    private String recurrence;   // ScheduleRecurrence Enum 매핑용
    private LocalDateTime recurrenceEndDate;  // 반복 종료일
    private String memo;

    public CallSchedule toEntity(Organization org, CareTarget target, User user, Scenario scenario) {
        return CallSchedule.builder()
                .organization(org)
                .targetType(ScheduleTargetType.CARE_TARGET)
                .careTarget(target)
                .scenario(scenario)
                .scheduledTime(this.scheduledTime)
                .nextRunAt(this.scheduledTime)
                .type(ScheduleType.valueOf(this.type))
                .priority(Priority.valueOf(this.priority))
                .recurrence(this.recurrence != null ? ScheduleRecurrence.valueOf(this.recurrence) : null)
                .recurrenceEndDate(this.recurrenceEndDate)
                .memo(this.memo)
                .createdBy(user)
                .status(ScheduleStatus.SCHEDULED)
                .scenario(scenario)
                .build();
    }
}
