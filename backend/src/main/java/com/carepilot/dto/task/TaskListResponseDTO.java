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
public class TaskListResponseDTO {
    private Long taskId;
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
}
