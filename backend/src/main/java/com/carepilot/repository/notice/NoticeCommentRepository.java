package com.carepilot.repository.notice;

import com.carepilot.domain.notice.NoticeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticeCommentRepository extends JpaRepository<NoticeComment, Long> {

    List<NoticeComment> findAllByNotice_NoticeIdOrderByCreatedAtAsc(Long noticeId);
}