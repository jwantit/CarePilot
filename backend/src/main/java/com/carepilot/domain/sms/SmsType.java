package com.carepilot.domain.sms;

/**
 * 수신 문자 분류 유형
 */
public enum SmsType {
    /** 환자 요청/특이사항 (AI 메모용) */
    SMS_AI_MEMO,
    /** 예약변경 요청 */
    SCHEDULE_CHANGE,
    /** 처방전(이미지) */
    PRESCRIPTION,
    /** 기타 */
    UNKNOWN
}
