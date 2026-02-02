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
@Table(name = "call_schedule", indexes = {
        @Index(name = "idx_call_schedule_status_next_run", columnList = "status, next_run_at"),
        @Index(name = "idx_call_schedule_status_scheduled", columnList = "status, scheduled_time")
})
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

    /** 워커가 "다음에 실행할 시각" 기준 (폴링용). 최초는 scheduledTime과 동일, 반복 시 실행 후 갱신. */
    @Column(name = "next_run_at")
    private LocalDateTime nextRunAt;

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
    @Column(name = "status", length = 20)
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
                       LocalDateTime nextRunAt,
                       ScheduleType type, ScheduleRecurrence recurrence, LocalDateTime recurrenceEndDate,
                       Priority priority, ScheduleStatus status, LocalDateTime completedAt,
                       Call call, Scenario scenario, String memo, User createdBy) {
        this.organization = organization;
        this.targetType = targetType;
        this.careTarget = careTarget;
        this.group = group;
        this.scheduledTime = scheduledTime;
        this.nextRunAt = nextRunAt;
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

    /** 시나리오 변경 (통화 시 사용할 시나리오) */
    public void updateScenario(com.carepilot.domain.config.Scenario scenario) {
        this.scenario = scenario;
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

    /** next_run_at 미설정 시 scheduledTime으로 보정 (단일 서버용) */
    public void ensureNextRunAtInitialized() {
        if (this.nextRunAt == null) {
            this.nextRunAt = this.scheduledTime;
        }
    }

    /** 단일 서버용: 실행 중 표시 (추후 다중 서버 시 locked_until, locked_by 추가) */
    public void markAsRunning() {
        this.status = ScheduleStatus.RUNNING;
    }

    /** 반복 스케줄: 다음 실행 시각 갱신 후 대기 상태로 */
    public void releaseToScheduled(LocalDateTime nextRunAt) {
        this.nextRunAt = nextRunAt;
        this.status = ScheduleStatus.SCHEDULED;
    }

    /** 반복 스케줄 실행 후: 주기 기준 시각(scheduled_time)을 다음 발생일로 한 주기만큼 진행 */
    public void advanceScheduledTime(LocalDateTime newScheduledTime) {
        this.scheduledTime = newScheduledTime;
    }

    /** 단발 스케줄: 완료 처리 */
    public void completeOneTime(LocalDateTime completedAt) {
        this.completedAt = completedAt;
        this.status = ScheduleStatus.COMPLETED;
    }

    /** 스케줄 수정 시 다음 실행 시각만 갱신 (예: 사용자가 scheduledTime 변경 시) */
    public void rescheduleNextRunAt(LocalDateTime nextRunAt) {
        this.nextRunAt = nextRunAt;
    }
}

