package com.carepilot.service.notice;

import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.dto.upload.TargetFileDTO;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.upload.UploadFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final UploadFileService uploadFileService;
    private final UploadFileRepository uploadFileRepository;

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
    public void saveNotice(NoticeSaveRequest request, Long userId, Long organizationId, List<MultipartFile> files) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 없습니다. userId=" + userId));

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("조직 정보를 찾을 수 없습니다."));

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned())
                .user(user)
                .organization(organization)
                .viewCount(0)
                .isDeleted(false)
                .build();

        Notice savedNotice = noticeRepository.save(notice);

        if (files != null && !files.isEmpty()) {
            TargetFileDTO fileDTO = TargetFileDTO.builder()
                    .targetType(UploadTargetType.NOTICE)
                    .targetId(savedNotice.getNoticeId())
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
    public void updateNotice(Long noticeId, NoticeSaveRequest request, Long userId, Long organizationId, List<MultipartFile> files) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("수정할 공지사항이 없습니다. noticeId=" + noticeId));

        // 작성자와 요청자가 같은지 확인
        notice.validateWriter(userId);
        notice.update(request.getTitle(), request.getContent(), request.getIsPinned());

        // 삭제할 파일들 처리
        if (request.getDeletedFileIds() != null && !request.getDeletedFileIds().isEmpty()) {
            // UploadFileRepository를 사용하여 직접 조회 (LAZY 로딩 문제 방지)
            List<com.carepilot.domain.file.UploadFile> allFiles = uploadFileRepository.findByNoticeId(noticeId);
            List<com.carepilot.domain.file.UploadFile> filesToDelete = allFiles.stream()
                    .filter(file -> request.getDeletedFileIds().contains(file.getFileId()))
                    .collect(Collectors.toList());
            
            if (!filesToDelete.isEmpty()) {
                uploadFileService.deleteFiles(notice.getOrganization().getOrganizationId(), noticeId, filesToDelete);
            }
        }

        // 새 파일 추가
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

        // 연결된 파일들도 삭제
        List<com.carepilot.domain.file.UploadFile> uploadFiles = notice.getUploadFiles();
        if (!uploadFiles.isEmpty()) {
            uploadFileService.deleteFiles(notice.getOrganization().getOrganizationId(), noticeId, uploadFiles);
        }

        notice.changeDeletedStatus(true);
    }

    @Override
    @Transactional
    public void incrementViewCount(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 없습니다. noticeId=" + noticeId));
        notice.setViewCount(notice.getViewCount() + 1);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UploadFileResponseDTO> getAttachedFilesByNoticeId(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 없습니다. noticeId=" + noticeId));

        return notice.getUploadFiles().stream()
                .map(uploadFile -> UploadFileResponseDTO.builder()
                        .fileId(uploadFile.getFileId())
                        .originalName(uploadFile.getOriginalName())
                        .contentType(uploadFile.getContentType())
                        .fileSize(uploadFile.getFileSize())
                        .uploadTargetType(uploadFile.getTargetType())
                        .fileUrl("/api/notices/files/" + uploadFile.getFileId() + "/download")
                        .thumbnailUrl(uploadFile.getThumbnailStoragePath() != null ? "/api/notices/files/" + uploadFile.getFileId() + "/thumbnail" : null)
                        .build())
                .collect(Collectors.toList());
    }
}