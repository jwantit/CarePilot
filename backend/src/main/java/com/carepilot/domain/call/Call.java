package com.carepilot.domain.call;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "calls")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Call extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_id")
    private Long callId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id", nullable = false)
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_schedule_id")
    private CallSchedule callSchedule;

    @Column(name = "operator_id")
    private Long operatorId;

    @Enumerated(EnumType.STRING)
    // @Column(name = "direction", nullable = false)
    @Column(name = "direction")
    private CallDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", length = 50)
    private CallType callType;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false)
    @Column(name = "status")
    private CallStatus status;

    @Column(name = "duration")
    private Integer duration;

    // @Column(name = "start_time", nullable = false)
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "ai_memo", columnDefinition = "TEXT")
    private String aiMemo;

    @Column(name = "caller_id", length = 50)
    private String callerId;

    @Column(name = "call_sid", length = 50, unique = true)
    private String callSid;

    @Builder
    public Call(Organization organization, CareTarget careTarget, CallSchedule callSchedule,
                Long operatorId, CallDirection direction, CallType callType, CallStatus status,
                Integer duration, LocalDateTime startTime, LocalDateTime endTime,
                String summary, String aiMemo, String callerId, String callSid) {
        this.organization = organization;
        this.careTarget = careTarget;
        this.callSchedule = callSchedule;
        this.operatorId = operatorId;
        this.direction = direction;
        this.callType = callType;
        this.status = status;
        this.duration = duration;
        this.startTime = startTime;
        this.endTime = endTime;
        this.summary = summary;
        this.aiMemo = aiMemo;
        this.callerId = callerId;
        this.callSid = callSid;
    }
}

