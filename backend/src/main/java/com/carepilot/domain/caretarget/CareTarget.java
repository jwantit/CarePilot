package com.carepilot.domain.caretarget;

import com.carepilot.domain.common.SoftDeleteEntity;
import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.CareTargetUpdateRequestDTO;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "care_targets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareTarget extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "care_target_id")
    private Long careTargetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    // @Column(name = "name", nullable = false)
    @Column(name = "name")
    private String name;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender")
    private String gender;

    @Column(name = "disease")
    private String disease;

    // @Column(name = "care_status", nullable = false)
    @Column(name = "care_status")
    private Boolean careStatus = true;

    @Column(name = "target_phone")
    private String targetPhone;

    @Column(name = "guardian_name")
    private String guardianName;

    @Column(name = "guardian_phone")
    private String guardianPhone;

    @Column(name = "guardian_relationship")
    private String guardianRelationship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Builder
    public CareTarget(Organization organization, String name, Integer age, String disease,
                     Boolean careStatus, String targetPhone, String guardianName,
                     String guardianPhone, String guardianRelationship, Doctor doctor, String gender) {
        this.organization = organization;
        this.name = name;
        this.age = age;
        this.disease = disease;
        this.careStatus = careStatus != null ? careStatus : true;
        this.targetPhone = targetPhone;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.guardianRelationship = guardianRelationship;
        this.doctor = doctor;
        this.gender = gender;
    }


    public void changeDetailInfo(CareTargetUpdateRequestDTO dto, Doctor doctor) {
        this.name = dto.getName();
        this.age = dto.getAge();
        this.gender = dto.getGender();
        this.disease = dto.getDisease();
        this.targetPhone = dto.getTargetPhone();
        this.guardianName = dto.getGuardianName();
        this.guardianPhone = dto.getGuardianPhone();
        this.guardianRelationship = dto.getGuardianRelationship();
        this.doctor = doctor;
    }
}

