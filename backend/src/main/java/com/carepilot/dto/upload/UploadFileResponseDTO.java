package com.carepilot.dto.upload;

import com.carepilot.domain.file.UploadTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UploadFileResponseDTO {
        private Long fileId;              // 식별자 (삭제/수정 시 필수)
        private String originalName;      // 화면에 표시할 파일명
        private String contentType;       // 파일 형식 (아이콘 표시용)
        private Long fileSize;            // 파일 용량 (사용자 안내용)
        private UploadTargetType uploadTargetType;

        private String fileUrl;           //원본
        private String thumbnailUrl;      // 썸네일이 있다면 썸네일 주소
        private String storagePath;       // 파일 저장 경로 (프론트엔드에서 getFileUrl 사용용)

}
