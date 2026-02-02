package com.carepilot.domain.sms;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inbound_sms")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class InboundSms extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inbound_sms_id")
    private Long inboundSmsId;

    @Column(name = "message_sid", length = 34)
    private String messageSid;

    @Column(name = "from_number", length = 20)
    private String fromNumber;

    @Column(name = "to_number", length = 20)
    private String toNumber;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    /** 미디어 저장 경로 (쉼표 구분, uploads 기준 상대경로) */
    @Column(name = "media_paths", columnDefinition = "TEXT")
    private String mediaPaths;

    /** 미디어 Content-Type (쉼표 구분, MediaPaths와 순서 일치) */
    @Column(name = "media_content_types", columnDefinition = "TEXT")
    private String mediaContentTypes;

    /** From 번호로 매칭된 CareTarget */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_target_id")
    private CareTarget careTarget;

    /** 분류 결과: SMS_AI_MEMO, SCHEDULE_CHANGE, PRESCRIPTION, UNKNOWN */
    @Enumerated(EnumType.STRING)
    @Column(name = "sms_type", length = 20)
    private SmsType smsType;

    /** 분류 수행 시각 */
    @Column(name = "classification_at")
    private LocalDateTime classificationAt;

    /** smsType, careTarget, classificationAt 업데이트용 */
    public void updateClassification(CareTarget careTarget, SmsType smsType, LocalDateTime classificationAt) {
        this.careTarget = careTarget;
        this.smsType = smsType;
        this.classificationAt = classificationAt;
    }
}
