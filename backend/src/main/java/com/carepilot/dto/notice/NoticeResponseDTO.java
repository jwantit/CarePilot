package com.carepilot.dto.notice;

import com.carepilot.domain.notice.Notice;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponseDTO {
    private Long noticeId;
    private String title;
    private String content;
    private String writerName; // User 엔티티의 name 추출
    private Integer viewCount;
    private Boolean isPinned;
    private LocalDateTime createdAt;

    public static NoticeResponseDTO from(Notice notice) {
        return NoticeResponseDTO.builder()
                .noticeId(notice.getNoticeId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .writerName(notice.getUser() != null ? notice.getUser().getName() : "익명")
                .viewCount(notice.getViewCount())
                .isPinned(notice.getIsPinned())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}