package com.carepilot.domain.config;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenario")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Scenario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scenario_id")
    private Long scenarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    // @Column(name = "name", nullable = false, length = 255)
    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    // @Column(name = "risk_level", nullable = false)
    @Column(name = "risk_level")
    private RiskLevel riskLevel;

    // @Column(name = "enabled", nullable = false)
    @Column(name = "enabled")
    private Boolean enabled = false;

    @Column(name = "risk_criteria", columnDefinition = "TEXT")
    private String riskCriteria;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScenarioQuestion> questions = new ArrayList<>();

    // CallSchedule과의 양방향 관계 (선택적)
    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<CallSchedule> callSchedules = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "created_by", nullable = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder
    public Scenario(Organization organization, String name, String description,
                   String category, RiskLevel riskLevel, Boolean enabled,
                   String riskCriteria, User createdBy) {
        this.organization = organization;
        this.name = name;
        this.description = description;
        this.category = category;
        this.riskLevel = riskLevel;
        this.enabled = enabled != null ? enabled : false;
        this.riskCriteria = riskCriteria;
        this.createdBy = createdBy;
    }

    public void update(String name, String description, String category,
                      RiskLevel riskLevel, Boolean enabled, String riskCriteria) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.riskLevel = riskLevel;
        this.enabled = enabled != null ? enabled : false;
        this.riskCriteria = riskCriteria;
    }

    public void changeEnabled(boolean enabled)
    {
        this.enabled = enabled;
    }
}

