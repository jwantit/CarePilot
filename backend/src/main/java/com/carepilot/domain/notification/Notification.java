package com.carepilot.domain.notification;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id")
    private Call call;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    // @Column(name = "severity", nullable = false)
    @Column(name = "severity")
    private RiskLevel severity;

    // @Column(name = "title", nullable = false, length = 255)
    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    // @Column(name = "type", nullable = false, length = 50)
    @Column(name = "type", length = 50)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false)
    @Column(name = "status")
    private NotificationStatus status = NotificationStatus.ACTIVE;

    // @Column(name = "occurred_at", nullable = false)
    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Builder
    public Notification(Organization organization, CareTarget careTarget, Call call,
                       User user, RiskLevel severity, String title, String description,
                       NotificationType type, NotificationStatus status, LocalDateTime occurredAt,
                       LocalDateTime resolvedAt, User resolvedBy) {
        this.organization = organization;
        this.careTarget = careTarget;
        this.call = call;
        this.user = user;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = status != null ? status : NotificationStatus.ACTIVE;
        this.occurredAt = occurredAt;
        this.resolvedAt = resolvedAt;
        this.resolvedBy = resolvedBy;
    }

    // 알림 읽음 처리
    public void markAsRead(User resolvedBy) {
        this.status = NotificationStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = resolvedBy;
    }
}

