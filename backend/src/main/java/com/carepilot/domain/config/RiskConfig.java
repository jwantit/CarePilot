package com.carepilot.domain.config;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "risk_config",
       uniqueConstraints = @UniqueConstraint(columnNames = "organization_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RiskConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_config_id")
    private Long riskConfigId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", unique = true, nullable = false)
    private Organization organization;

    // @Column(name = "critical_threshold", nullable = false)
    @Column(name = "critical_threshold")
    private Integer criticalThreshold;

    // @Column(name = "high_threshold", nullable = false)
    @Column(name = "high_threshold")
    private Integer highThreshold;

    // @Column(name = "medium_threshold", nullable = false)
    @Column(name = "medium_threshold")
    private Integer mediumThreshold;

    // @Column(name = "low_threshold", nullable = false)
    @Column(name = "low_threshold")
    private Integer lowThreshold;

    @Builder
    public RiskConfig(Organization organization, Integer criticalThreshold,
                     Integer highThreshold, Integer mediumThreshold, Integer lowThreshold) {
        this.organization = organization;
        this.criticalThreshold = criticalThreshold;
        this.highThreshold = highThreshold;
        this.mediumThreshold = mediumThreshold;
        this.lowThreshold = lowThreshold;
    }
}

