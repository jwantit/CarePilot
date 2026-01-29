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
public class AITaskListResponseDTO {
    private Long aiTaskId;
    private String taskType;
    private String status;
    private Long careTargetId;
    private String careTargetName;
    private String resultSummary;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
