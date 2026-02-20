package com.carepilot.domain.task;

/**
 * 통합 작업 상태 (USER + AI)
 * - USER: WAITING, PROGRESS, DONE
 * - AI: WAITING, SUCCESS, FAILED
 */
public enum TaskStatus {
    WAITING,    // 대기
    PROGRESS,   // 진행 중 (USER)
    DONE,       // 완료 (USER)
    SUCCESS,    // 성공 (AI)
    FAILED      // 실패 (AI)
}

