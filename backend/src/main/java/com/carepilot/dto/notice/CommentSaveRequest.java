package com.carepilot.dto.notice;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommentSaveRequest {
    private String content;
    private Long userId;
    private Long parentId;
}