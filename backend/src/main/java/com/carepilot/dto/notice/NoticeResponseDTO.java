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
    private String writerName;
    private Integer viewCount;
    private Boolean isPinned;
    private LocalDateTime createdAt;
    private List<UploadFileResponseDTO> files;

    public static NoticeResponseDTO from(Notice notice) {
        return NoticeResponseDTO.builder()
                .noticeId(notice.getNoticeId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .writerName(notice.getUser() != null ? notice.getUser().getName() : "익명")
                .viewCount(notice.getViewCount())
                .isPinned(notice.getIsPinned())
                .createdAt(notice.getCreatedAt())
                .files(notice.getUploadFiles() != null ? notice.getUploadFiles().stream()
                        .map(file -> UploadFileResponseDTO.builder()
                                .fileId(file.getFileId())
                                .originalName(file.getOriginalName())
                                .fileUrl(file.getStoragePath())
                                .thumbnailUrl(file.getThumbnailStoragePath())
                                .contentType(file.getContentType())
                                .fileSize(file.getFileSize())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .build();
    }
}