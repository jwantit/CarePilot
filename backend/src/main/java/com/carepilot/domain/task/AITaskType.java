package com.carepilot.domain.task;

/**
 * AI 작업 타입
 * - CALL_INIT: 전화 발신
 * - SCHEDULE_CHANGE: 스케줄 변경
 * - RISK_ALERT: 위험 알림 생성
 * - AUTOMATION: 자동화 업무 (알림, 작업, 그룹 관리 / 케어대상자 정보 수정 / 설정 변경 등)
 * - OTHER: 기타
 */
public enum AITaskType {
    CALL_INIT,
    SCHEDULE_CHANGE,
    RISK_ALERT,
    AUTOMATION,
    OTHER
}

