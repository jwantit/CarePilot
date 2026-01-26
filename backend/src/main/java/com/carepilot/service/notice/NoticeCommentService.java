package com.carepilot.service.notice;

import com.carepilot.dto.notice.CommentResponseDTO;
import java.util.List;

public interface NoticeCommentService {
    // 댓글/대댓글 저장
    Long saveComment(Long noticeId, Long userId, Long parentId, String content);

    // 게시물의 댓글 목록 조회
    List<CommentResponseDTO> getCommentsByNoticeId(Long noticeId);

    // 댓글 수정
    void updateComment(Long commentId, String content);

    // 댓글 삭제
    void deleteComment(Long commentId);

    void disconnectCommentsFromNotice(Long noticeId);
}