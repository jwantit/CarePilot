package com.carepilot.service.notice;

import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NoticeService {

    Page<NoticeResponseDTO> getAllNotices(Pageable pageable);

    NoticeResponseDTO getNoticeById(Long noticeId);

    void saveNotice(NoticeSaveRequest request, Long userId, List<MultipartFile> files);
    void updateNotice(Long noticeId, NoticeSaveRequest request, Long userId, List<MultipartFile> files);
    void deleteNotice(Long noticeId, Long userId);
    void incrementViewCount(Long noticeId);
}