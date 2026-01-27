package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeService {
    //CRUD 기능
    Page<Notice> getAllNotices(Pageable pageable);   // 공지사항 정렬 기능

    Notice getNoticeById(Long id);  // 공지사항 상세 조회
    void saveNotice(Notice notice); // 새 글 생성(저장)
    void updateNotice(Long id, Notice updateParam); // 내용 수정
    void deleteNotice(Long id); // 글 삭제
    void incrementViewCount(Long id); // 조회수 증가
}