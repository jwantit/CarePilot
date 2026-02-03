package com.carepilot.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 통합 작업 상세 응답 (USER + AI)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponseDTO {
    private Long taskId;
    private String sourceType;  // AI | USER
    private Long organizationId;
    private Long careTargetId;
    private String careTargetName;
    private String title;
    private String description;
    private String type;
    private String priority;
    private String status;
    private Long createdByUserId;
    private String createdByName;
    private Long assignedToUserId;
    private String assignedToName;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // AI용 필드
    private Long callId;
    private Long scheduleId;
    private Long notificationId;
    private Long groupId;
    private String result;
    private LocalDateTime startedAt;
    private Long inboundSmsId;      // 수동 SCHEDULE_CHANGE용 (시작→AI 트리거 가능 여부)
}
