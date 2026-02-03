package com.carepilot.dto.notice;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class NoticeSaveRequest {
    private String title;
    private String content;
    private Boolean isPinned;
    private String noticeType; // "NORMAL", "NOTICE", "MANUAL"
    private List<Long> deletedFileIds; // 삭제할 파일 ID 목록
}