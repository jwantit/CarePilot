package com.carepilot.domain.config;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Table(name = "notification_config",
       uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_config_id")
    private Long notificationConfigId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    // @Column(name = "sms_enabled", nullable = false)
    @Column(name = "sms_enabled")
    private Boolean smsEnabled = false;

    // @Column(name = "kakao_enabled", nullable = false)
    @Column(name = "kakao_enabled")
    private Boolean kakaoEnabled = false;

    // @Column(name = "email_enabled", nullable = false)
    @Column(name = "email_enabled")
    private Boolean emailEnabled = false;

    // @Column(name = "risk_detection_enabled", nullable = false)
    @Column(name = "risk_detection_enabled")
    private Boolean riskDetectionEnabled = true;

    // @Column(name = "call_failure_enabled", nullable = false)
    @Column(name = "call_failure_enabled")
    private Boolean callFailureEnabled = true;

    // @Column(name = "emergency_event_enabled", nullable = false)
    @Column(name = "emergency_event_enabled")
    private Boolean emergencyEventEnabled = true;

    @Column(name = "night_restriction_start")
    private LocalTime nightRestrictionStart;

    @Column(name = "night_restriction_end")
    private LocalTime nightRestrictionEnd;

    @Builder
    public NotificationConfig(Organization organization, User user,
                             Boolean smsEnabled, Boolean kakaoEnabled, Boolean emailEnabled,
                             Boolean riskDetectionEnabled, Boolean callFailureEnabled,
                             Boolean emergencyEventEnabled, LocalTime nightRestrictionStart,
                             LocalTime nightRestrictionEnd) {
        this.organization = organization;
        this.user = user;
        this.smsEnabled = smsEnabled != null ? smsEnabled : false;
        this.kakaoEnabled = kakaoEnabled != null ? kakaoEnabled : false;
        this.emailEnabled = emailEnabled != null ? emailEnabled : false;
        this.riskDetectionEnabled = riskDetectionEnabled != null ? riskDetectionEnabled : true;
        this.callFailureEnabled = callFailureEnabled != null ? callFailureEnabled : true;
        this.emergencyEventEnabled = emergencyEventEnabled != null ? emergencyEventEnabled : true;
        this.nightRestrictionStart = nightRestrictionStart;
        this.nightRestrictionEnd = nightRestrictionEnd;
    }

    public void updateSettings(
            Boolean smsEnabled,
            Boolean kakaoEnabled,
            Boolean emailEnabled,
            Boolean riskDetectionEnabled,
            Boolean callFailureEnabled,
            Boolean emergencyEventEnabled,
            LocalTime nightRestrictionStart,
            LocalTime nightRestrictionEnd
    ) {
        this.smsEnabled = smsEnabled != null ? smsEnabled : false;
        this.kakaoEnabled = kakaoEnabled != null ? kakaoEnabled : false;
        this.emailEnabled = emailEnabled != null ? emailEnabled : false;
        this.riskDetectionEnabled = riskDetectionEnabled != null ? riskDetectionEnabled : true;
        this.callFailureEnabled = callFailureEnabled != null ? callFailureEnabled : true;
        this.emergencyEventEnabled = emergencyEventEnabled != null ? emergencyEventEnabled : true;
        this.nightRestrictionStart = nightRestrictionStart;
        this.nightRestrictionEnd = nightRestrictionEnd;
    }
}

