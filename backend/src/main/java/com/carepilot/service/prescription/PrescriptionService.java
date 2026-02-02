package com.carepilot.service.prescription;

import com.carepilot.domain.sms.InboundSms;

/**
 * 처방전 이미지 분석 서비스 (OCR/LLM)
 */
public interface PrescriptionService {

    /**
     * PRESCRIPTION 타입 InboundSms의 이미지들을 분석하여 prescription 테이블에 저장
     *
     * @param inboundSms 분류 완료된 InboundSms (smsType=PRESCRIPTION)
     */
    void processPrescription(InboundSms inboundSms);
}
