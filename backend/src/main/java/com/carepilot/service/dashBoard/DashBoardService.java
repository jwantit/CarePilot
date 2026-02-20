package com.carepilot.service.dashBoard;

import com.carepilot.domain.notification.Notification;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.task.TaskListResponseDTO;

import java.util.List;
import java.util.Map;

public interface DashBoardService {

    Map<String, Object> calculateCallStats(Long organizationId);
    Map<String, Object> calculateRiskStats(Long organizationId);
    Map<String, Object> calculateTaskStats();
    Map<String, Object> calculateNotificationStats(Long userId);
    List<CareTargetListResponseDTO> getUrgentPatients(Long organizationId);
    List<TaskListResponseDTO> getWaitingTasks(Long organizationId);
    List<TaskListResponseDTO> getUrgentWaitingTasks(Long organizationId);
    List<TaskListResponseDTO> getInProgressTasks(Long organizationId);
    List<Notification> getUrgentNotifications(Long organizationId, Long userId);
    List<Map<String, Object>> getTodaySchedules(Long organizationId);
    List<Notification> getRecentNotifications(Long organizationId, Long userId);
    List<TaskListResponseDTO> getRecentTasks(Long organizationId);
    List<Map<String, Object>> getUrgentItems(Long organizationId, Long userId);
    List<Map<String, Object>> getRecentItems(Long organizationId, Long userId);
}
