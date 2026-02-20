package com.carepilot.domain.notification;

/**
 * 알림 유형
 * - VITAL_SIGN: 생체신호 알림
 * - EMERGENCY: 긴급 알림
 * - MEDICATION: 약물 관련 알림
 * - CALL: 통화 관련 알림
 * - RISK_DETECTION: 위험 감지 알림
 * - SCHEDULE: 스케줄 관련 알림
 * - OTHER: 기타
 */
public enum NotificationType {
    VITAL_SIGN,
    EMERGENCY,
    MEDICATION,
    CALL,
    RISK_DETECTION,
    SCHEDULE,
    SIGNUP_APPROVAL,
    OTHER
}

