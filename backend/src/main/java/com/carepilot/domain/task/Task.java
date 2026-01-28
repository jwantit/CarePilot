package com.carepilot.domain.task;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    // @Column(name = "title", nullable = false, length = 255)
    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    // @Column(name = "type", nullable = false, length = 50)
    @Column(name = "type", length = 50)
    private TaskType type;

    @Enumerated(EnumType.STRING)
    // @Column(name = "priority", nullable = false, length = 20)
    @Column(name = "priority", length = 20)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false, length = 20)
    @Column(name = "status", length = 20)
    private TaskStatus status = TaskStatus.WAITING;

    @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "created_by", nullable = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder
    public Task(Organization organization, CareTarget careTarget, String title,
               String description, TaskType type, Priority priority, TaskStatus status,
               User createdBy, User assignedTo, LocalDateTime dueDate, LocalDateTime completedAt) {
        this.organization = organization;
        this.careTarget = careTarget;
        this.title = title;
        this.description = description;
        this.type = type;
        this.priority = priority != null ? priority : Priority.MEDIUM;
        this.status = status != null ? status : TaskStatus.WAITING;
        this.createdBy = createdBy;
        this.assignedTo = assignedTo;
        this.dueDate = dueDate;
        this.completedAt = completedAt;
    }

    /** 상태 변경 (대기/진행중/완료) */
    public void changeStatus(TaskStatus status) {
        this.status = status;
        if (status == TaskStatus.DONE) {
            this.completedAt = LocalDateTime.now();
        }
    }

    /** 할당자 변경 */
    public void assignTo(User user) {
        this.assignedTo = user;
    }

    /** 수정 시 상세 정보 변경 */
    public void updateDetails(String title, String description, TaskType type, Priority priority,
                              CareTarget careTarget, User assignedTo, LocalDateTime dueDate) {
        if (title != null) this.title = title;
        if (description != null) this.description = description;
        if (type != null) this.type = type;
        if (priority != null) this.priority = priority;
        if (careTarget != null) this.careTarget = careTarget;
        this.assignedTo = assignedTo;
        if (dueDate != null) this.dueDate = dueDate;
    }
}

