package com.carepilot.domain.file;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "upload_file")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UploadFile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    // @Column(name = "target_type", nullable = false)
    @Column(name = "target_type")
    private UploadTargetType targetType;

    @Enumerated(EnumType.STRING)
    // @Column(name = "file_type", nullable = false, length = 50)
    @Column(name = "file_type", length = 50)
    private UploadFileType fileType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id")
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id")
    private Call call;

    // @Column(name = "original_name", nullable = false)
    @Column(name = "original_name")
    private String originalName;

    // @Column(name = "storage_path", nullable = false)
    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "thumbnail_storage_path")
    private String thumbnailStoragePath;

    @Column(name = "file_size")
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Builder
    public UploadFile(Organization organization, UploadTargetType targetType, UploadFileType fileType,
                     Notice notice, CareTarget careTarget, Call call, String originalName,
                     String storagePath, String contentType, String thumbnailStoragePath,
                     Long fileSize, User uploadedBy) {
        this.organization = organization;
        this.targetType = targetType;
        this.fileType = fileType;
        this.notice = notice;
        this.careTarget = careTarget;
        this.call = call;
        this.originalName = originalName;
        this.storagePath = storagePath;
        this.contentType = contentType;
        this.thumbnailStoragePath = thumbnailStoragePath;
        this.fileSize = fileSize;
        this.uploadedBy = uploadedBy;
    }
}

