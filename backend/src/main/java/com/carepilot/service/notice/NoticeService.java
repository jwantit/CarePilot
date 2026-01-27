package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.dto.notice.NoticeResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeService {

    Page<NoticeResponseDTO> getAllNotices(Pageable pageable);

    NoticeResponseDTO getNoticeById(Long id);
    void saveNotice(Notice notice, Long userId);
    void updateNotice(Long id, Notice updateParam, Long userId);
    void deleteNotice(Long id, Long userId);
    void incrementViewCount(Long id);
}