package com.carepilot.controller;

import com.carepilot.dto.notice.CommentResponseDTO;
import com.carepilot.service.notice.NoticeCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class NoticeCommentController {

    private final NoticeCommentService commentService;

    // 특정 게시물의 댓글 목록 조회
    @GetMapping("/{noticeId}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long noticeId) {
        List<CommentResponseDTO> comments = commentService.getCommentsByNoticeId(noticeId);
        return ResponseEntity.ok(comments);
    }

    // 댓글 및 대댓글 등록
    @PostMapping("/{noticeId}/comments")
    public ResponseEntity<Long> saveComment(
            @PathVariable Long noticeId,
            @RequestBody Map<String, Object> requestData) {

        String content = (String) requestData.get("content");
        Long userId = Long.valueOf(requestData.get("userId").toString());

        Object parentIdObj = requestData.get("parentId");
        Long parentId = (parentIdObj != null) ? Long.valueOf(parentIdObj.toString()) : null;

        Long commentId = commentService.saveComment(noticeId, userId, parentId, content);
        return ResponseEntity.ok(commentId);
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> requestData) {

        String content = requestData.get("content");

        commentService.updateComment(commentId, content);

        return ResponseEntity.ok().build(); // 성공 시 200 OK 반환
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {

        commentService.deleteComment(commentId);

        return ResponseEntity.ok().build(); // 성공 시 200 OK 반환
    }
}