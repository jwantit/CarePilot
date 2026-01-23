package com.carepilot.domain.caretarget;

import com.carepilot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "care_target_group_map",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "care_target_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareTargetGroupMap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "map_id")
    private Long mapId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CareTargetGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id", nullable = false)
    private CareTarget careTarget;

    @Builder
    public CareTargetGroupMap(CareTargetGroup group, CareTarget careTarget) {
        this.group = group;
        this.careTarget = careTarget;
    }
}

