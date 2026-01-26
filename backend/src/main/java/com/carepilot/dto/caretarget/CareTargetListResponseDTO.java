package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareTargetListResponseDTO {
    private Long careTargetId;
    private String thumbnailStoragePath;
    private String name;
    private int age;
    private String disease;
    private int riskScore;
    private String recentCall;
    private Boolean careStatus;
}
