package com.carepilot.domain.user;

import com.carepilot.domain.common.SoftDeleteEntity;
import com.carepilot.domain.organization.Organization;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    // @Column(name = "email", unique = true, nullable = false, length = 255)
    @Column(name = "email", unique = true, length = 255)
    private String email;

    // @Column(name = "password", nullable = false, length = 255)
    @Column(name = "password", length = 255)
    private String password;

    // @Column(name = "name", nullable = false, length = 100)
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    // @Column(name = "role", nullable = false, length = 20)
    @Column(name = "role", length = 20)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Enumerated(EnumType.STRING)
    // @Column(name = "status", nullable = false, length = 20)
    @Column(name = "status", length = 20)
    private UserStatus status = UserStatus.WAITING;
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }

    @Column(name = "approval_requested_at")
    private LocalDateTime approvalRequestedAt;
    
    public void setApprovalRequestedAt(LocalDateTime approvalRequestedAt) {
        this.approvalRequestedAt = approvalRequestedAt;
    }

    @Column(name = "approval_processed_at")
    private LocalDateTime approvalProcessedAt;
    
    public void setApprovalProcessedAt(LocalDateTime approvalProcessedAt) {
        this.approvalProcessedAt = approvalProcessedAt;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    @Column(name = "is_social")
    private Boolean isSocial = false;

    // 개인정보 수정을 위한 setter 추가
    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    @Builder
    public User(String email, String password, String name, String phone, 
                UserRole role, Organization organization, UserStatus status, Boolean isSocial) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.role = role;
        this.organization = organization;
        this.status = status != null ? status : UserStatus.WAITING;
        this.isSocial = isSocial != null ? isSocial : false;
    }
}

