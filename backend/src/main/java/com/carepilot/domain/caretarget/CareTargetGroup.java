package com.carepilot.domain.caretarget;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "care_target_groups",
       uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "group_name"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareTargetGroup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long groupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    // @Column(name = "group_name", nullable = false)
    @Column(name = "group_name")
    private String groupName;

    @Column(name = "group_description", columnDefinition = "TEXT")
    private String groupDescription;

    //시나리오
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id")
    private Scenario scenario;

    // @Column(name = "group_status", nullable = false)
    @Column(name = "group_status")
    private Boolean groupStatus = true;

    @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "created_by", nullable = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder
    public CareTargetGroup(Organization organization, String groupName, String groupDescription,
                          Scenario scenario, Boolean groupStatus, User createdBy) {
        this.organization = organization;
        this.groupName = groupName;
        this.groupDescription = groupDescription;
        this.groupStatus = groupStatus != null ? groupStatus : true;
        this.createdBy = createdBy;
        this.scenario = scenario;
    }

    public void updateInfo(String groupName, String groupDescription, Boolean groupStatus) {
        if (groupName != null && !groupName.isBlank()) {
            this.groupName = groupName;
        }

        if (groupDescription != null) {
            this.groupDescription = groupDescription;
        }

        if (groupStatus != null) {
            this.groupStatus = groupStatus;
        }
    }

    public void updateScenario(Scenario scenario) {
        this.scenario = scenario;
    }


}

