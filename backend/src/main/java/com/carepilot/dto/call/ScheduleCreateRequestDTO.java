package com.carepilot.dto.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.user.User;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.enums.ScheduleRecurrence;
import com.carepilot.domain.enums.ScheduleStatus;
import com.carepilot.domain.enums.ScheduleType;
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
    private LocalDateTime scheduledTime;
    private String type;         // ScheduleType Enum 매핑용
    private String priority;     // Priority Enum 매핑용
    private String recurrence;   // ScheduleRecurrence Enum 매핑용
    private String memo;

    public CallSchedule toEntity(Organization org, CareTarget target, User user) {
        return CallSchedule.builder()
                .organization(org)
                .careTarget(target)
                .scheduledTime(this.scheduledTime)
                .type(ScheduleType.valueOf(this.type))
                .priority(Priority.valueOf(this.priority))
                .recurrence(this.recurrence != null ? ScheduleRecurrence.valueOf(this.recurrence) : null)
                .memo(this.memo)
                .createdBy(user)
                .status(ScheduleStatus.SCHEDULED)
                .build();
    }
}
