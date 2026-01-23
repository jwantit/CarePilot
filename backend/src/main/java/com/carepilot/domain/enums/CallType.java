package com.carepilot.domain.enums;

/**
 * 통화 목적/성격
 * - REGULAR_MONITORING: 정기 모니터링
 * - EMERGENCY: 긴급 통화
 * - MEDICATION_CHECK: 약물 확인
 * - SYMPTOM_CHECK: 증상 체크
 * - FOLLOW_UP: 후속 조치
 * - OTHER: 기타
 */
public enum CallType {
    REGULAR_MONITORING,
    EMERGENCY,
    MEDICATION_CHECK,
    SYMPTOM_CHECK,
    FOLLOW_UP,
    OTHER
}

