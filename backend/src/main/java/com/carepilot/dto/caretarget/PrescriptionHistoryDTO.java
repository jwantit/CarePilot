package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 케어대상 상세 화면용 처방 이력 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionHistoryDTO {
    private Long prescriptionId;

    /** 처방일 (yyyy-MM-dd) */
    private String prescribedDate;

    /** AI 요약 + 분석 */
    private String summary;

    /** 진단 목록 JSON */
    private String diagnoses;

    /** 처방약 목록 JSON */
    private String medications;
    
    /** 분석 일시 (yyyy-MM-dd HH:mm) */
    private String analyzedAt;
    
    /** 처방전 이미지 다운로드 URL (upload_file 기준) */
    private String imageFileUrl;
}
