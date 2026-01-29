package com.carepilot.service.notice;

import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeService {

    Page<NoticeResponseDTO> getAllNotices(Pageable pageable);

    NoticeResponseDTO getNoticeById(Long id);

    void saveNotice(NoticeSaveRequest request, Long userId);
    void updateNotice(Long id, NoticeSaveRequest request, Long userId);
    void deleteNotice(Long id, Long userId);
    void incrementViewCount(Long id);
}