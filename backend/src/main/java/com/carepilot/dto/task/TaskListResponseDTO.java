package com.carepilot.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 통합 작업 목록 응답 (USER + AI)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskListResponseDTO {
    private Long taskId;
    private String sourceType;  // AI | USER
    private String title;
    private Long careTargetId;
    private String careTargetName;
    private String type;
    private String priority;
    private String status;
    private Long assignedToUserId;
    private String assignedToName;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private String resultSummary;   // AI용
    private LocalDateTime startedAt; // AI용
    private LocalDateTime createdAt;
    private Long inboundSmsId;      // 수동 SCHEDULE_CHANGE용 (시작→AI 트리거 가능 여부)
}
