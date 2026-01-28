package com.carepilot.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AITaskResponseDTO {
    private Long aiTaskId;
    private Long organizationId;
    private String taskType;
    private String status;
    private Long callId;
    private Long scheduleId;
    private Long notificationId;
    private Long taskId;
    private Long careTargetId;
    private String careTargetName;
    private Long groupId;
    private String result;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
