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
        Page<NoticeResponseDTO> response = noticeService.getAllNotices(pageable)
                .map(notice -> NoticeResponseDTO.builder()
                        .noticeId(notice.getNoticeId())
                        .title(notice.getTitle())
                        .content(notice.getContent())
                        .writerName(notice.getUser().getName()) // 연관 객체에서 이름 추출
                        .viewCount(notice.getViewCount())
                        .isPinned(notice.getIsPinned())
                        .createdAt(notice.getCreatedAt())
                        .build());

        return ResponseEntity.ok(response);
    }

    // 상세 조회 + 조회수 증가 로직
    @GetMapping("/{id}")
    public ResponseEntity<Notice> getNotice(@PathVariable Long id) {
        noticeService.incrementViewCount(id);
        Notice notice = noticeService.getNoticeById(id);
        return ResponseEntity.ok(notice);
    }

    // 공지사항 작성
    @PostMapping
    public ResponseEntity<Void> createNotice(@RequestBody Notice notice) {
        noticeService.saveNotice(notice);
        return ResponseEntity.ok().build();
    }

    // 공지사항 수정
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateNotice(@PathVariable Long id, @RequestBody Notice notice) {
        noticeService.updateNotice(id, notice);
        return ResponseEntity.ok().build();
    }

    // 공지사항 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok().build();
    }
}