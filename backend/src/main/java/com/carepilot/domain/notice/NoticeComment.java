package com.carepilot.domain.notice;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notice_comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoticeComment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = true)
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private NoticeComment parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NoticeComment> children = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // @Column(name = "is_deleted", nullable = false)
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Builder
    public NoticeComment(Notice notice, NoticeComment parentComment, User user,
                         String content, Boolean isDeleted) {
        this.notice = notice;
        this.parentComment = parentComment;
        this.user = user;
        this.content = content;
        this.isDeleted = isDeleted != null ? isDeleted : false;
    }

    public void updateContent(String content) {
        this.content = content;
    }

    public void changeDeletedStatus(Boolean status) {
        this.isDeleted = status;
    }

    public void setNoticeNull() {
        this.notice = null;
    }

    public void validateWriter(Long requestUserId) {
        if (!this.user.getUserId().equals(requestUserId)) {
            throw new RuntimeException("댓글에 대한 권한이 없습니다.");
        }
    }
}