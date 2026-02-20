package com.carepilot.domain.notice;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import com.carepilot.domain.file.UploadFile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "notice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"user", "organization", "uploadFiles"})
@org.hibernate.annotations.Where(clause = "is_deleted = false")
public class Notice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Long noticeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UploadFile> uploadFiles = new ArrayList<>();

    // @Column(name = "title", nullable = false, length = 255)
    @Column(name = "title", length = 255)
    private String title;

    // @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // @Column(name = "view_count", nullable = false)
    @Column(name = "view_count")
    private Integer viewCount = 0;

    // @Column(name = "is_pinned", nullable = false)
    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "notice_type")
    private NoticeType noticeType = NoticeType.NORMAL;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "content_modified_at")
    private LocalDateTime contentModifiedAt; // 게시물 내용이 실제로 수정된 시간 (댓글과 무관)

    @Builder
    public Notice(Long noticeId, Organization organization, User user, String title,
                  String content, Integer viewCount, Boolean isPinned, NoticeType noticeType, Boolean isDeleted) {
        this.noticeId = noticeId;
        this.organization = organization;
        this.user = user;
        this.title = title;
        this.content = content;
        this.viewCount = viewCount != null ? viewCount : 0;
        this.isPinned = isPinned != null ? isPinned : false;
        this.noticeType = noticeType != null ? noticeType : NoticeType.NORMAL;
        this.isDeleted = isDeleted != null ? isDeleted : false;
    }
    // 작성자 설정
    public void setUser(User user) {
        this.user = user;
    }
    public void setOrganization(Organization organization) {
        this.organization = organization;
    }
    // 공지사항 수정 로직
    public void update(String title, String content, Boolean isPinned, NoticeType noticeType) {
        this.title = title;
        this.content = content;
        this.isPinned = isPinned;
        this.noticeType = noticeType != null ? noticeType : NoticeType.NORMAL;
        // 게시물 내용이 실제로 수정되었을 때만 contentModifiedAt 업데이트
        this.contentModifiedAt = LocalDateTime.now();
    }
    // 조회수 증가 로직
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public void changeDeletedStatus(Boolean status) {
        this.isDeleted = status;
    }

    // 권한 검증 로직
    public void validateWriter(Long requestUserId) {
        if (!this.user.getUserId().equals(requestUserId)) {
            throw new RuntimeException("공지사항에 대한 권한이 없습니다.");
        }
    }

    // 파일 추가 편의 메서드
    public void addFile(com.carepilot.domain.file.UploadFile file) {
        this.uploadFiles.add(file);
        file.setNotice(this);
    }

    // 파일 제거 편의 메서드
    public void removeFile(com.carepilot.domain.file.UploadFile file) {
        this.uploadFiles.remove(file);
        file.setNotice(null);
    }

    // 모든 파일 관계를 끊는 메서드 (삭제 시 유용)
    public void clearFiles() {
        this.uploadFiles.forEach(file -> file.setNotice(null));
        this.uploadFiles.clear();
    }
}