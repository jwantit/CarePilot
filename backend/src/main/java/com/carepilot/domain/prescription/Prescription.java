package com.carepilot.domain.prescription;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.sms.InboundSms;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescription")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Prescription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id", nullable = false)
    private CareTarget careTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "upload_file_id", nullable = false)
    private UploadFile uploadFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inbound_sms_id")
    private InboundSms inboundSms;

    @Column(name = "prescribed_date")
    private LocalDate prescribedDate;

    @Column(name = "raw_ocr_text", columnDefinition = "TEXT")
    private String rawOcrText;

    /** 진단 목록 JSON: [{"name":"분태성 고혈압","icdCode":"I10"}, ...] */
    @Column(name = "diagnoses", columnDefinition = "TEXT")
    private String diagnoses;

    /** 처방약 목록 JSON: [{"name":"압료디민정 5mg","dosage":"1회 1정","frequency":"1일 1회","timing":"아침 식후","duration":"30일분"}, ...] */
    @Column(name = "medications", columnDefinition = "TEXT")
    private String medications;

    /** AI가 처방전을 분석해 요약한 내용 */
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;
}
