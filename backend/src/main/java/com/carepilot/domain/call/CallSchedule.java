package com.carepilot.domain.call;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.enums.*;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_schedule")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CallSchedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    // @Column(name = "target_type", nullable = false)
    @Column(name = "target_type")
    private ScheduleTargetType targetType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private CareTargetGroup group;

    // @Column(name = "scheduled_time", nullable = false)
    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Enumerated(EnumType.STRING)
    // @Column(name = "type", nullable = false)
    @Column(name = "type")
    private ScheduleType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence")
    private ScheduleRecurrence recurrence;

    @Column(name = "recurrence_end_date")
    private LocalDateTime recurrenceEndDate;

    @Enumerated(EnumType.STRING)
    // @Column(name = "priority", nullable = false)
    @Column(name = "priority")
    private Priority priority;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false)
    @Column(name = "status")
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id")
    private Call call;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id")
    private Scenario scenario;

    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "created_by", nullable = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder
    public CallSchedule(Organization organization, ScheduleTargetType targetType,
                       CareTarget careTarget, CareTargetGroup group, LocalDateTime scheduledTime,
                       ScheduleType type, ScheduleRecurrence recurrence, LocalDateTime recurrenceEndDate,
                       Priority priority, ScheduleStatus status, LocalDateTime completedAt,
                       Call call, Scenario scenario, String memo, User createdBy) {
        this.organization = organization;
        this.targetType = targetType;
        this.careTarget = careTarget;
        this.group = group;
        this.scheduledTime = scheduledTime;
        this.type = type;
        this.recurrence = recurrence;
        this.recurrenceEndDate = recurrenceEndDate;
        this.priority = priority;
        this.status = status != null ? status : ScheduleStatus.SCHEDULED;
        this.completedAt = completedAt;
        this.call = call;
        this.scenario = scenario;
        this.memo = memo;
        this.createdBy = createdBy;
    }

    public void applyUpdates(CareTarget careTarget,
                             LocalDateTime scheduledTime,
                             ScheduleType type,
                             ScheduleRecurrence recurrence,
                             LocalDateTime recurrenceEndDate,
                             Priority priority,
                             String memo) {
        if (careTarget != null) {
            this.careTarget = careTarget;
        }
        if (scheduledTime != null) {
            this.scheduledTime = scheduledTime;
        }
        if (type != null) {
            this.type = type;
        }
        if (recurrence != null) {
            this.recurrence = recurrence;
        }
        if (recurrenceEndDate != null) {
            this.recurrenceEndDate = recurrenceEndDate;
        }
        if (priority != null) {
            this.priority = priority;
        }
        if (memo != null) {
            this.memo = memo;
        }
    }

    public void cancel() {
        this.status = ScheduleStatus.CANCELLED;
    }

    public void restore() {
        this.status = ScheduleStatus.SCHEDULED;
    }

    //업데이트 함수
    public void updateSchedule(
            LocalDateTime scheduledTime,
            ScheduleType type,
            ScheduleRecurrence recurrence,
            LocalDateTime recurrenceEndDate,
            Priority priority,
            String memo
    ){
        this.scheduledTime = scheduledTime;
        this.type = type;
        this.recurrence = (type == ScheduleType.RECURRING) ? recurrence : null;
        this.recurrenceEndDate = (type == ScheduleType.RECURRING) ? recurrenceEndDate : null;
        this.priority = priority;
        this.memo = memo;
    }
}

