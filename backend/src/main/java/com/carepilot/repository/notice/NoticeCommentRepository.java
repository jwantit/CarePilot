package com.carepilot.repository.notice;

import com.carepilot.domain.notice.NoticeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticeCommentRepository extends JpaRepository<NoticeComment, Long> {

    List<NoticeComment> findAllByNotice_NoticeIdOrderByCreatedAtAsc(Long noticeId);

    @Query("SELECT c FROM NoticeComment c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH c.parentComment p " +
           "LEFT JOIN FETCH p.user " +
           "WHERE c.notice.noticeId = :noticeId " +
           "ORDER BY c.createdAt ASC")
    List<NoticeComment> findAllByNoticeIdWithUser(@Param("noticeId") Long noticeId);

    @Query("SELECT COUNT(c) FROM NoticeComment c WHERE c.notice.noticeId = :noticeId AND c.isDeleted = false")
    Long countByNoticeId(@Param("noticeId") Long noticeId);
}