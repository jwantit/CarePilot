package com.carepilot.controller.notice;

import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.service.notice.NoticeService;
import com.carepilot.repository.upload.UploadFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriUtils;

import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final UploadFileRepository uploadFileRepository;

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

        noticeService.saveNotice(noticeSaveRequest, userId, organizationId, files);

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

        noticeService.updateNotice(noticeId, noticeSaveRequest, userId, organizationId, files);

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

    // 파일 다운로드 엔드포인트
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        com.carepilot.domain.file.UploadFile uploadFile = uploadFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다. id=" + fileId));

        try {
            Resource resource = new UrlResource("file:" + uploadFile.getStoragePath());

            if (resource.exists() && resource.isReadable()) {
                String encodedFileName = UriUtils.encode(uploadFile.getOriginalName(), StandardCharsets.UTF_8);
                String contentDisposition = "attachment; filename=\"" + encodedFileName + "\"";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(uploadFile.getContentType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                        .body(resource);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없거나 읽을 수 없습니다.");
            }
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 다운로드 경로 오류: " + e.getMessage());
        }
    }

    // 썸네일 이미지 제공 엔드포인트
    @GetMapping("/files/{fileId}/thumbnail")
    public ResponseEntity<Resource> getThumbnail(@PathVariable Long fileId) {
        com.carepilot.domain.file.UploadFile uploadFile = uploadFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다. id=" + fileId));

        String thumbnailPath = uploadFile.getThumbnailStoragePath();
        if (thumbnailPath == null || thumbnailPath.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "썸네일을 찾을 수 없습니다.");
        }

        try {
            Resource resource = new UrlResource("file:" + thumbnailPath);
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG) // 또는 MediaType.IMAGE_PNG 등 실제 썸네일 타입에 맞게
                        .body(resource);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "썸네일을 찾을 수 없거나 읽을 수 없습니다.");
            }
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "썸네일 경로 오류: " + e.getMessage());
        }
    }
}