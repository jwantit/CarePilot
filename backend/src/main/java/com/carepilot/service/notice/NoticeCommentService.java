package com.carepilot.service.notice;

import com.carepilot.dto.notice.CommentResponseDTO;
import com.carepilot.dto.notice.CommentSaveRequest;
import java.util.List;

public interface NoticeCommentService {
    Long saveComment(Long noticeId, CommentSaveRequest request);    // 댓글/대댓글 저장

    List<CommentResponseDTO> getCommentsByNoticeId(Long noticeId);  // 게시물의 댓글 목록 조회

    void updateComment(Long commentId, CommentSaveRequest request); // 댓글 수정

    void deleteComment(Long commentId, Long userId);    // 댓글 삭제
}