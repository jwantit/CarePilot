package com.carepilot.dto.task;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskRequestDTO {
    private Long careTargetId;
    private String title;
    private String description;
    private String type;      // TaskType enum(RISK_FOLLOWUP, CARE, NORMAL, OTHER)
    private String priority;  // Priority enum(LOW, MEDIUM, HIGH)
    private Long assignedToUserId;
    private LocalDateTime dueDate;
}
