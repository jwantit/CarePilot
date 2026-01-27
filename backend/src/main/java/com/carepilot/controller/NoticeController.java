package com.carepilot.controller;

import com.carepilot.domain.notice.Notice;
import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.service.notice.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // 목록 조회
    @GetMapping
    public ResponseEntity<Page<NoticeResponseDTO>> getAllNotices(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(noticeService.getAllNotices(pageable));
    }

    // 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<NoticeResponseDTO> getNotice(@PathVariable Long id) {
        noticeService.incrementViewCount(id);
        return ResponseEntity.ok(noticeService.getNoticeById(id));
    }

    // 공지사항 작성
    @PostMapping
    public ResponseEntity<Void> createNotice(
            @RequestBody Notice notice,
            @RequestParam Long userId) { // 작성자 ID 수신
        noticeService.saveNotice(notice, userId);
        return ResponseEntity.ok().build();
    }

    // 공지사항 수정
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateNotice(
            @PathVariable Long id,
            @RequestBody Notice updateParam,
            @RequestParam Long userId) {
        noticeService.updateNotice(id, updateParam, userId);
        return ResponseEntity.ok().build();
    }

    // 공지사항 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long id,
            @RequestParam Long userId) {
        noticeService.deleteNotice(id, userId);
        return ResponseEntity.ok().build();
    }
}