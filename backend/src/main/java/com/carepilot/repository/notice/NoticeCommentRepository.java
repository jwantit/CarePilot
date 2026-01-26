package com.carepilot.repository.notice;

import com.carepilot.domain.notice.NoticeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoticeCommentRepository extends JpaRepository<NoticeComment, Long> {

    @Query("SELECT c FROM NoticeComment c WHERE c.notice.noticeId = :noticeId ORDER BY c.commentId ASC")
    List<NoticeComment> findAllByNoticeId(@Param("noticeId") Long noticeId);
}