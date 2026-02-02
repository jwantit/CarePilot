package com.carepilot.domain.task;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AITask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ai_task_id")
    private Long aiTaskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    // @Column(name = "task_type", nullable = false, length = 50)
    @Column(name = "task_type", length = 50)
    private AITaskType taskType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id")
    private Call call;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private CallSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id")
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private CareTargetGroup group;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false, length = 20)
    @Column(name = "status", length = 20)
    private AITaskStatus status = AITaskStatus.WAITING;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder
    public AITask(Organization organization, AITaskType taskType, Call call,
                  CallSchedule schedule, Notification notification, Task task,
                  CareTarget careTarget, CareTargetGroup group, AITaskStatus status,
                  String result, LocalDateTime startedAt, LocalDateTime completedAt) {
        this.organization = organization;
        this.taskType = taskType;
        this.call = call;
        this.schedule = schedule;
        this.notification = notification;
        this.task = task;
        this.careTarget = careTarget;
        this.group = group;
        this.status = status != null ? status : AITaskStatus.WAITING;
        this.result = result;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    /**
     * 작업 상태와 결과를 업데이트합니다.
     */
    public void updateStatus(AITaskStatus status, String result, LocalDateTime completedAt) {
        this.status = status;
        this.result = result;
        this.completedAt = completedAt;
    }

    /**
     * 스케줄을 업데이트합니다.
     */
    public void updateSchedule(CallSchedule schedule) {
        this.schedule = schedule;
    }
}

