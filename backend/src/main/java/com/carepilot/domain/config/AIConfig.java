package com.carepilot.domain.config;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ai_config",
       uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "feature_name"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AIConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ai_config_id")
    private Long aiConfigId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    // @Column(name = "feature_name", nullable = false, length = 100)
    @Column(name = "feature_name", length = 100)
    private String featureName;

    // @Column(name = "is_enabled", nullable = false)
    @Column(name = "is_enabled")
    private Boolean isEnabled = false;

    @Column(name = "config_value", columnDefinition = "JSON")
    private String configValue;

    @Builder
    public AIConfig(Organization organization, String featureName,
                   Boolean isEnabled, String configValue) {
        this.organization = organization;
        this.featureName = featureName;
        this.isEnabled = isEnabled != null ? isEnabled : false;
        this.configValue = configValue;
    }

    public void changeEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled != null ? isEnabled : false;
    }
}

