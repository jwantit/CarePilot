package com.carepilot.dto.notice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {
    private Long commentId;      // 댓글 고유 번호
    private String content;      // 댓글 내용
    private String userName;     // 작성자 이름 (User 엔티티에서 추출)
    private Long userId;         // 작성자 ID (수정/삭제 권한 확인용)
    private Long parentId;       // 부모 댓글 ID (대댓글인 경우 필수)
    private LocalDateTime createdAt; // 작성 시간

    // 대댓글 목록 (이 리스트에 자식 DTO들을 담아서 트리 구조를 만듭니다)
    private List<CommentResponseDTO> children;
}