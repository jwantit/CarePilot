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
public class TaskResponseDTO {
    private Long taskId;
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
}
