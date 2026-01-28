package com.carepilot.dto.notice;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class NoticeSaveRequest {
    private String title;
    private String content;
    private Boolean isPinned;
}