package com.carepilot.dto.upload;

import com.carepilot.domain.file.UploadTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TargetFileDTO {
    UploadTargetType targetType;
    private Long targetId;
    private Long careTargetId;
    private Long organizationId;
    private Long userId;
    private List<MultipartFile> files;
}
