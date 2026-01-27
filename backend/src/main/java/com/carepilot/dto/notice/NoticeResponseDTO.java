package com.carepilot.dto.notice;

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
}