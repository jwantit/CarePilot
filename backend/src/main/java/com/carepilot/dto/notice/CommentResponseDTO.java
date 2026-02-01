package com.carepilot.dto.notice;

import com.carepilot.domain.notice.NoticeComment;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private Long parentCommentId;       // 부모 댓글 ID (대댓글인 경우 필수)
    private LocalDateTime createdAt; // 작성 시간
    private List<CommentResponseDTO> children;  // 대댓글 목록

    public static CommentResponseDTO from(NoticeComment comment) {
        // 삭제 여부에 따른 데이터 가공 로직을 DTO 내부로 캡슐화
        boolean isDeleted = comment.getIsDeleted();

        return CommentResponseDTO.builder()
                .commentId(comment.getCommentId())
                // 삭제된 댓글이면 내용을 치환
                .content(isDeleted ? "삭제된 댓글입니다" : comment.getContent())
                // 삭제된 댓글이면 이름을 비움
                .userName(isDeleted ? "" : (comment.getUser() != null ? comment.getUser().getName() : "익명"))
                .userId(comment.getUser() != null ? comment.getUser().getUserId() : null)
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getCommentId() : null)
                .createdAt(comment.getCreatedAt())
                .children(new ArrayList<>())
                .build();
    }
}