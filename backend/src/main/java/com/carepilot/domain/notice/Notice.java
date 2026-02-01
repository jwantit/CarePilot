package com.carepilot.domain.notice;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import com.carepilot.domain.file.UploadFile;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Builder
    public Notice(Organization organization, User user, String title,
                  String content, Integer viewCount, Boolean isPinned, Boolean isDeleted) {
        this.organization = organization;
        this.user = user;
        this.title = title;
        this.content = content;
        this.viewCount = viewCount != null ? viewCount : 0;
        this.isPinned = isPinned != null ? isPinned : false;
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
    public void update(String title, String content, Boolean isPinned) {
        this.title = title;
        this.content = content;
        this.isPinned = isPinned;
    }
    // 조회수 증가 로직
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public void changeDeletedStatus(Boolean status) {
        this.isDeleted = status;
    }

    public void validateWriter(Long requestUserId) {
        if (!this.user.getUserId().equals(requestUserId)) {
            throw new RuntimeException("공지사항에 대한 권한이 없습니다.");
        }
    }
}