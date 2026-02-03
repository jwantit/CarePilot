package com.carepilot.dto.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponseDTO {
    private Long noticeId;
    private String title;
    private String content;
    private Long writerId;
    private String writerName;
    private Integer viewCount;
    private Boolean isPinned;
    private String noticeType; // "NORMAL", "NOTICE", "MANUAL"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; // 수정 시간
    private LocalDateTime contentModifiedAt; // 게시물 내용이 실제로 수정된 시간
    private List<UploadFileResponseDTO> files;
    private Integer commentCount; // 댓글 개수

    public static NoticeResponseDTO from(Notice notice) {
        return NoticeResponseDTO.builder()
                .noticeId(notice.getNoticeId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .writerId(notice.getUser() != null ? notice.getUser().getUserId() : null)
                .writerName(notice.getUser() != null ? notice.getUser().getName() : "익명")
                .viewCount(notice.getViewCount())
                .isPinned(notice.getIsPinned())
                .noticeType(notice.getNoticeType() != null ? notice.getNoticeType().name() : "NORMAL")
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .contentModifiedAt(notice.getContentModifiedAt())
                .files(notice.getUploadFiles() != null ? notice.getUploadFiles().stream()
                        .map(file -> UploadFileResponseDTO.builder()
                                .fileId(file.getFileId())
                                .originalName(file.getOriginalName())
                                .fileUrl("/api/notices/files/" + file.getFileId() + "/download") // 다운로드 URL
                                .thumbnailUrl(file.getThumbnailStoragePath() != null ? "/api/notices/files/" + file.getFileId() + "/thumbnail" : null) // 썸네일 URL
                                .storagePath(file.getStoragePath()) // 파일 저장 경로 (프론트엔드에서 getFileUrl 사용용)
                                .contentType(file.getContentType())
                                .fileSize(file.getFileSize())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .commentCount(null) // Service에서 설정
                .build();
    }
}