package com.carepilot.domain.config;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctor")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Doctor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doctor_id")
    private Long doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    // @Column(name = "name", nullable = false, length = 100)
    @Column(name = "name", length = 100)
    private String name;

    // @Column(name = "email", unique = true, nullable = false, length = 255)
    @Column(name = "email", unique = true, length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "specialty", length = 100)
    private String specialty;

    @Enumerated(EnumType.STRING)
    // @Column(name = "role", nullable = false)
    @Column(name = "role")
    private DoctorRole role;

    // @Column(name = "is_active", nullable = false)
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Builder
    public Doctor(Organization organization, String name, String email, String phone,
                 String specialty, DoctorRole role, Boolean isActive, String memo) {
        this.organization = organization;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.specialty = specialty;
        this.role = role;
        this.isActive = isActive != null ? isActive : true;
        this.memo = memo;
    }

    public void update(String name, String email, String phone, String specialty,
                      DoctorRole role, Boolean isActive, String memo) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.specialty = specialty;
        this.role = role;
        this.isActive = isActive != null ? isActive : true;
        this.memo = memo;
    }
}

