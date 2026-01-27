package com.carepilot.dto.caretarget;

import com.carepilot.domain.notification.RiskLevel;
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
    private String gender;
    private int age;
    private String disease;
    private int riskScore; //리스크 점수
    private RiskLevel riskLevel; //리스크 레벨
    private String recentCall;
    private Boolean careStatus;


    public CareTargetListResponseDTO(Long careTargetId, String name, int age, String gender, String disease, RiskLevel riskLevel) {
        this.careTargetId = careTargetId;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.disease = disease;
        this.riskLevel = riskLevel;
    }
}
