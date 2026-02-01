package com.carepilot.controller;

import com.carepilot.dto.notice.CommentResponseDTO;
import com.carepilot.dto.notice.CommentSaveRequest;
import com.carepilot.service.notice.NoticeCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeCommentController {

    private final NoticeCommentService commentService;

    // 특정 게시물의 댓글 목록 조회
    @GetMapping("/{noticeId}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long noticeId) {
        return ResponseEntity.ok(commentService.getCommentsByNoticeId(noticeId));
    }

    // 댓글 및 대댓글 등록
    @PostMapping("/{noticeId}/comments")
    public ResponseEntity<Long> saveComment(
            @PathVariable Long noticeId,
            @RequestBody CommentSaveRequest request) {

        return ResponseEntity.ok(commentService.saveComment(noticeId, request));
    }

    // 댓글 수정
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentSaveRequest request,
            @RequestParam Long userId) {

        commentService.updateComment(commentId, request, userId);

        return ResponseEntity.ok().build();
    }

    // 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long userId) {

        commentService.deleteComment(commentId, userId);

        return ResponseEntity.ok().build();
    }
}