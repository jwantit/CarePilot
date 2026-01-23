package com.carepilot.domain.notice;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private NoticeComment parentComment;

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
}

