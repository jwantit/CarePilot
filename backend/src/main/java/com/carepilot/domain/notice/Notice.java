package com.carepilot.domain.notice;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @Builder
    public Notice(Organization organization, User user, String title,
                 String content, Integer viewCount, Boolean isPinned) {
        this.organization = organization;
        this.user = user;
        this.title = title;
        this.content = content;
        this.viewCount = viewCount != null ? viewCount : 0;
        this.isPinned = isPinned != null ? isPinned : false;
    }
}

