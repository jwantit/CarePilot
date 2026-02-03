package com.carepilot.repository.notice;

import com.carepilot.domain.notice.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    long countByIsPinnedTrue();

    Page<Notice> findAllByOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    @Query("SELECT n FROM Notice n " +
           "LEFT JOIN FETCH n.user " +
           "LEFT JOIN FETCH n.uploadFiles " +
           "WHERE n.noticeId = :noticeId")
    java.util.Optional<Notice> findByIdWithUser(@Param("noticeId") Long noticeId);
}