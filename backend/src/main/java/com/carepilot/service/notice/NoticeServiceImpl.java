package com.carepilot.service.notice;

import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.user.User;
import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.dto.upload.TargetFileDTO;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.upload.UploadFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final UploadFileService uploadFileService;

    // 모든 공지사항 조회
    @Override
    public Page<NoticeResponseDTO> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable)
                .map(NoticeResponseDTO::from);
    }

    // 공지사항 상세 조회
    @Override
    public NoticeResponseDTO getNoticeById(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. noticeId=" + noticeId));
        return NoticeResponseDTO.from(notice);
    }

    // 새 글 생성 및 저장
    @Override
    @Transactional
    public void saveNotice(NoticeSaveRequest request, Long userId, List<MultipartFile> files) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 없습니다. userId=" + userId));

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned())
                .user(user)
                .organization(user.getOrganization())
                .build();

        Notice saveNotice = noticeRepository.save(notice);

        if (files != null && !files.isEmpty()) {
            TargetFileDTO fileDTO = TargetFileDTO.builder()
                    .targetType(UploadTargetType.NOTICE) // 공지사항 타입 지정
                    .targetId(saveNotice.getNoticeId()) // 생성된 게시글 ID
                    .organizationId(user.getOrganization().getOrganizationId())
                    .userId(userId)
                    .files(files)
                    .build();

            uploadFileService.saveFiles(fileDTO);
        }
    }

    // 글 수정
    @Override
    @Transactional
    public void updateNotice(Long noticeId, NoticeSaveRequest request, Long userId, List<MultipartFile> files) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("수정할 공지사항이 없습니다. noticeId=" + noticeId));

        // 작성자와 요청자가 같은지 확인
        notice.validateWriter(userId);
        notice.update(request.getTitle(), request.getContent(), request.getIsPinned());

        if (files != null && !files.isEmpty()) {
            TargetFileDTO fileDTO = TargetFileDTO.builder()
                    .targetType(UploadTargetType.NOTICE)
                    .targetId(notice.getNoticeId())
                    .organizationId(notice.getOrganization().getOrganizationId())
                    .userId(userId)
                    .files(files)
                    .build();

            uploadFileService.saveFiles(fileDTO);
        }
    }

    // 글 삭제
    @Override
    @Transactional
    public void deleteNotice(Long noticeId, Long userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 공지사항이 없습니다. noticeId=" + noticeId));

        notice.validateWriter(userId);
        notice.changeDeletedStatus(true);
    }

    @Override
    @Transactional
    public void incrementViewCount(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 없습니다. noticeId=" + noticeId));
        notice.setViewCount(notice.getViewCount() + 1);
    }
}