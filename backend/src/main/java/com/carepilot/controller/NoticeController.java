package com.carepilot.controller;

import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.service.notice.NoticeService;
import com.carepilot.service.upload.UploadFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final UploadFileService uploadFileService;

    // 목록 조회
    @GetMapping
    public ResponseEntity<Page<NoticeResponseDTO>> getAllNotices(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(noticeService.getAllNotices(pageable));
    }

    // 상세 조회
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeResponseDTO> getNotice(@PathVariable Long noticeId) {
        noticeService.incrementViewCount(noticeId);
        return ResponseEntity.ok(noticeService.getNoticeById(noticeId));
    }

    // 공지사항 작성
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Void> createNotice(
            @RequestPart("notice") NoticeSaveRequest noticeSaveRequest,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam Long userId,
            @RequestParam Long organizationId) {

        noticeService.saveNotice(noticeSaveRequest, userId, files);

        return ResponseEntity.ok().build();
    }

    // 공지사항 수정
    @PutMapping(value = "/{noticeId}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Void> updateNotice(
            @PathVariable Long noticeId,
            @RequestPart("notice") NoticeSaveRequest noticeSaveRequest,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam Long userId,
            @RequestParam Long organizationId) {

        noticeService.updateNotice(noticeId, noticeSaveRequest, userId, files);

        return ResponseEntity.ok().build();
    }

    // 공지사항 삭제
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long noticeId,
            @RequestParam Long userId) {
        noticeService.deleteNotice(noticeId, userId);
        return ResponseEntity.ok().build();
    }
}