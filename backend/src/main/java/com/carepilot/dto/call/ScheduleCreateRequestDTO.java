package com.carepilot.dto.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
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
    private Long careTargetId;  // 개인 대상자 (targetType이 CARE_TARGET일 때)
    private Long groupId;        // 그룹 (targetType이 GROUP일 때)
    private Long scenarioId;    // 선택 시나리오 (통화 시 사용)
    private LocalDateTime scheduledTime;
    private String type;         // ScheduleType Enum 매핑용
    private String priority;     // Priority Enum 매핑용
    private String recurrence;   // ScheduleRecurrence Enum 매핑용
    private LocalDateTime recurrenceEndDate;  // 반복 종료일
    private String memo;

    public CallSchedule toEntity(Organization org, CareTarget target, CareTargetGroup group, User user, Scenario scenario) {
        ScheduleTargetType targetType = group != null ? ScheduleTargetType.GROUP : ScheduleTargetType.CARE_TARGET;
        
        return CallSchedule.builder()
                .organization(org)
                .targetType(targetType)
                .careTarget(target)
                .group(group)
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
                .build();
    }
}
