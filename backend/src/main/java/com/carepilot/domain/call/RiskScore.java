package com.carepilot.domain.call;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.enums.RiskLevel;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_score")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RiskScore extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_score_id")
    private Long riskScoreId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id", nullable = false)
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id")
    private Call call;

    // @Column(name = "risk_score", nullable = false)
    @Column(name = "risk_score")
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    // @Column(name = "risk_level", nullable = false, length = 20)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    // @Column(name = "calculated_at", nullable = false)
    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @Builder
    public RiskScore(Organization organization, CareTarget careTarget, Call call,
                    Integer riskScore, RiskLevel riskLevel, LocalDateTime calculatedAt) {
        this.organization = organization;
        this.careTarget = careTarget;
        this.call = call;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.calculatedAt = calculatedAt;
    }
}

