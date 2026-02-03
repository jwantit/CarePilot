package com.carepilot.domain.task;

/**
 * 통합 작업 유형 (USER + AI)
 * - RISK_FOLLOWUP: 위험 후속조치
 * - CARE: 케어 관리
 * - OTHER: 기타
 * - CALL_INIT: 전화 발신 (AI)
 * - SCHEDULE_CHANGE: 스케줄 변경 (AI)
 * - RISK_ALERT: 위험 알림 생성 (AI)
 * - AUTOMATION: 자동화 업무 (AI)
 * - NOTICE_CREATE: 공지사항 작성 (챗봇)
 * - CARETARGET_UPDATE: 케어 대상 수정 (챗봇)
 */
public enum TaskType {
    RISK_FOLLOWUP,
    CARE,
    OTHER,
    CALL_INIT,
    SCHEDULE_CHANGE,
    RISK_ALERT,
    AUTOMATION,
    NOTICE_CREATE,
    CARETARGET_UPDATE
}

