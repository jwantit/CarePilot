package com.carepilot.service.dashBoard;

import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.service.call.CallService;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.carepilot.dto.call.ScheduleResponseDTO;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;

import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskStatus;
import org.springframework.data.domain.PageRequest;

import com.carepilot.security.util.UserUtil;


import com.carepilot.repository.notification.NotificationRepository;

@Service
@RequiredArgsConstructor
@Log4j2
public class DashBoardServiceImpl implements DashBoardService{

    private final CallService callService;
    private final CareService careService;
    private final NotificationService notificationService;
    private final CallRepository callRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final UserUtil userUtil;

    //오늘의 통화 ---------------------------------------------------------
    @Override
    public Map<String, Object> calculateCallStats(Long organizationId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);

        long todayTotalCount = callRepository.countByOrganizationIdAndDateRange(organizationId, todayStart, todayEnd);
        long todaySuccessCount = callRepository.countByOrganizationIdAndStatusAndDateRange(organizationId, CallStatus.SUCCESS, todayStart, todayEnd);

        int todaySuccessRate = todayTotalCount > 0 ? (int) Math.round((todaySuccessCount * 100.0) / todayTotalCount) : 0;
        Map<String, Object> callStats = new HashMap<>();
        callStats.put("todayTotal", (int) todayTotalCount);
        callStats.put("todaySuccessRate", todaySuccessRate);

        log.info("통화 통계(DB 최적화): 오늘 {}건(성공률 {}%)", todayTotalCount, todaySuccessRate);
        return callStats;
    }
    //------------------------------------------------------------------




    @Override
    public Map<String, Object> calculateRiskStats(Long organizationId) {
        List<CareTargetListResponseDTO> careTargets = careService.getCareTargetList(organizationId, "");

        long riskPatients = careTargets.stream()
                .filter(patient -> {
                    if (patient.getRiskLevel() == null) return false;
                    String riskLevel = patient.getRiskLevel().name();
                    return "HIGH".equals(riskLevel) || "CRITICAL".equals(riskLevel);
                })
                .count();

        long urgentPatients = careTargets.stream()
                .filter(patient -> {
                    if (patient.getRiskLevel() == null) return false;
                    return "CRITICAL".equals(patient.getRiskLevel().name());
                })
                .count();

        Map<String, Object> riskStats = new HashMap<>();
        riskStats.put("total", (int) riskPatients);
        riskStats.put("urgent", (int) urgentPatients);

        return riskStats;
    }

    @Override
    public Map<String, Object> calculateTaskStats() {
        Long organizationId = getCurrentOrgId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        long totalToday = taskRepository.countTodayTasksByStatus(organizationId, null, startOfDay, endOfDay);
        long waitingToday = taskRepository.countTodayTasksByStatus(organizationId, TaskStatus.WAITING, startOfDay, endOfDay);

        Map<String, Object> taskStats = new HashMap<>();
        taskStats.put("total", (int) totalToday);
        taskStats.put("waiting", (int) waitingToday);
        return taskStats;
    }

    @Override
    public Map<String, Object> calculateNotificationStats(Long userId) {
        Long organizationId = getCurrentOrgId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        long totalToday = notificationRepository.countByOrganizationIdAndStatusAndDateRange(organizationId, null, startOfDay, endOfDay);
        long unprocessedToday = notificationRepository.countByOrganizationIdAndStatusAndDateRange(organizationId, NotificationStatus.ACTIVE, startOfDay, endOfDay);

        Map<String, Object> notificationStats = new HashMap<>();
        notificationStats.put("total", (int) totalToday);
        notificationStats.put("unprocessed", (int) unprocessedToday);

        return notificationStats;
    }

    @Override
    public List<CareTargetListResponseDTO> getUrgentPatients(Long organizationId) {
        List<CareTargetListResponseDTO> careTargets = careService.getCareTargetList(organizationId, "");
        return careTargets.stream()
                .filter(patient -> patient.getRiskLevel() != null && "CRITICAL".equals(patient.getRiskLevel().name()))
                .sorted((a, b) -> Integer.compare(b.getRiskScore(), a.getRiskScore()))
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskListResponseDTO> getWaitingTasks(Long organizationId) {
        return taskRepository.findWaitingTasks(organizationId, PageRequest.of(0, 10))
                .stream()
                .map(this::mapToTaskListDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskListResponseDTO> getUrgentWaitingTasks(Long organizationId) {
        return taskRepository.findTop5UrgentWaitingTasks(organizationId, PageRequest.of(0, 5))
                .stream()
                .map(this::mapToTaskListDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskListResponseDTO> getInProgressTasks(Long organizationId) {
        return taskRepository.findInProgressTasks(organizationId, PageRequest.of(0, 10))
                .stream()
                .map(this::mapToTaskListDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> getUrgentNotifications(Long organizationId, Long userId) {
        List<Notification> allNotifications = userId != null ? notificationService.getNotificationsByUserId(userId) : new ArrayList<>();
        return allNotifications.stream()
                .filter(notif -> notif.getSeverity() != null && notif.getStatus() != null &&
                        ("CRITICAL".equals(notif.getSeverity().name()) || "HIGH".equals(notif.getSeverity().name())) &&
                        "ACTIVE".equals(notif.getStatus().name()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getTodaySchedules(Long organizationId) {
        LocalDateTime now = LocalDateTime.now();
        List<ScheduleResponseDTO> monthSchedules = callService.getSchedulesByMonth(organizationId, now.getYear(), now.getMonthValue());
        String todayDateStr = String.format("%04d-%02d-%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());

        List<ScheduleResponseDTO> todaySchedules = monthSchedules.stream()
                .filter(s -> s.getScheduledTime() != null && s.getScheduledTime().startsWith(todayDateStr))
                .collect(Collectors.toList());

        Map<String, Integer> priorityOrder = Map.of("URGENT", 4, "HIGH", 3, "MEDIUM", 2, "LOW", 1);
        todaySchedules.sort((a, b) -> {
            int aPriority = priorityOrder.getOrDefault(a.getPriority(), 0);
            int bPriority = priorityOrder.getOrDefault(b.getPriority(), 0);
            if (aPriority != bPriority) return Integer.compare(bPriority, aPriority);
            String aTimeStr = a.getScheduledTime() != null ? a.getScheduledTime() : a.getNextRunAt();
            String bTimeStr = b.getScheduledTime() != null ? b.getScheduledTime() : b.getNextRunAt();
            if (aTimeStr == null && bTimeStr == null) return 0;
            if (aTimeStr == null) return 1;
            if (bTimeStr == null) return -1;
            return aTimeStr.compareTo(bTimeStr);
        });



        return todaySchedules.stream()
                .limit(5)
                .map(schedule -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("scheduleId", schedule.getScheduleId());
                    map.put("careTargetId", schedule.getCareTargetId());
                    map.put("scheduledTime", schedule.getScheduledTime());
                    map.put("nextRunAt", schedule.getNextRunAt());
                    map.put("careTargetName", schedule.getCareTargetName());
                    map.put("targetGroupName", schedule.getTargetGroupName());
                    map.put("status", schedule.getStatus());
                    map.put("priority", schedule.getPriority());
                    String timeStr = schedule.getScheduledTime() != null ? schedule.getScheduledTime() : schedule.getNextRunAt();
                    map.put("formattedTime", formatTimeForDisplay(timeStr));
                    map.put("displayStatus", calculateScheduleStatus(schedule));
                    map.put("scheduleType", schedule.getType());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> getRecentNotifications(Long organizationId, Long userId) {
        List<Notification> allNotifications = userId != null ? notificationService.getNotificationsByUserId(userId) : new ArrayList<>();
        return allNotifications.stream()
                .filter(notif -> notif.getSeverity() != null && notif.getStatus() != null &&
                        !"CRITICAL".equals(notif.getSeverity().name()) && !"HIGH".equals(notif.getSeverity().name()) &&
                        "ACTIVE".equals(notif.getStatus().name()))
                .sorted((a, b) -> {
                    if (a.getOccurredAt() == null && b.getOccurredAt() == null) return 0;
                    if (a.getOccurredAt() == null) return 1;
                    if (b.getOccurredAt() == null) return -1;
                    return b.getOccurredAt().compareTo(a.getOccurredAt());
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskListResponseDTO> getRecentTasks(Long organizationId) {
        return taskRepository.findTop5RecentActivityTasks(organizationId, PageRequest.of(0, 5))
                .stream()
                .map(this::mapToTaskListDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getUrgentItems(Long organizationId, Long userId) {
        List<Map<String, Object>> items = new ArrayList<>();

        // 긴급 환자
        getUrgentPatients(organizationId).forEach(patient -> {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "patient");
            item.put("data", patient);
            item.put("time", patient.getRiskCalculatedAt());
            item.put("formattedTime", formatDateTimeForUrgentItems(patient.getRiskCalculatedAt()));
            items.add(item);
        });

        // 긴급 작업
        getUrgentWaitingTasks(organizationId).forEach(task -> {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "task");
            item.put("data", task);
            item.put("time", task.getCreatedAt());
            item.put("formattedTime", formatDateTimeForUrgentItems(task.getCreatedAt()));
            items.add(item);
        });

        // 긴급 알림
        getUrgentNotifications(organizationId, userId).forEach(notif -> {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "notification");
            item.put("data", notif);
            item.put("time", notif.getOccurredAt());
            item.put("formattedTime", formatDateTimeForUrgentItems(notif.getOccurredAt()));
            items.add(item);
        });

        items.sort((a, b) -> {
            LocalDateTime timeA = (LocalDateTime) a.get("time");
            LocalDateTime timeB = (LocalDateTime) b.get("time");
            if (timeA == null && timeB == null) return 0;
            if (timeA == null) return 1;
            if (timeB == null) return -1;
            return timeA.compareTo(timeB);
        });

        return items.stream().limit(5).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getRecentItems(Long organizationId, Long userId) {
        return taskRepository.findTop5RecentActivityTasks(organizationId, PageRequest.of(0, 6))
                .stream()
                .map(task -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("type", "task");
                    item.put("data", mapToTaskListDTO(task));
                    return item;
                })
                .collect(Collectors.toList());
    }


    private Long getCurrentOrgId() {
        return userUtil.getCurrentUser().getOrganization().getOrganizationId();
    }
    private TaskListResponseDTO mapToTaskListDTO(Task t) {
        if (t == null) return null;
        
        String targetName = null;
        Long targetId = null;
        if (t.getCareTarget() != null) {
            targetName = t.getCareTarget().getName();
            targetId = t.getCareTarget().getCareTargetId();
        }

        String assignedName = null;
        Long assignedId = null;
        if (t.getAssignedTo() != null) {
            assignedName = t.getAssignedTo().getName();
            assignedId = t.getAssignedTo().getUserId();
        }

        return TaskListResponseDTO.builder()
                .taskId(t.getTaskId())
                .sourceType(t.getSourceType() != null ? t.getSourceType().name() : null)
                .title(t.getTitle())
                .careTargetId(targetId)
                .careTargetName(targetName)
                .type(t.getType() != null ? t.getType().name() : null)
                .priority(t.getPriority() != null ? t.getPriority().name() : null)
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .assignedToUserId(assignedId)
                .assignedToName(assignedName)
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .resultSummary(t.getResult()) // 대시보드에서는 요약으로 사용
                .startedAt(t.getStartedAt())
                .createdAt(t.getCreatedAt())
                .inboundSmsId(t.getInboundSms() != null ? t.getInboundSms().getInboundSmsId() : null)
                .build();
    }

    // --------------------------------------------------------------------------------

    private String calculateScheduleStatus(ScheduleResponseDTO schedule) {

        if (schedule.getStatus() == null) {
            return ScheduleStatus.SCHEDULED.getKoName();
        }
        try {
            return ScheduleStatus
                    .valueOf(schedule.getStatus())
                    .getKoName();
        } catch (IllegalArgumentException e) {
            return ScheduleStatus.SCHEDULED.getKoName();
        }
    }

    private String formatTimeForDisplay(String timeStr) {
        if (timeStr == null || timeStr.isEmpty()) return null;
        try {
            DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            LocalDateTime dateTime = LocalDateTime.parse(timeStr, inputFormatter);
            int hour = dateTime.getHour();
            String ampm = hour >= 12 ? "오후" : "오전";
            int displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
            return String.format("%s %d:%02d", ampm, displayHour, dateTime.getMinute());
        } catch (Exception e) {
            return null;
        }
    }

    private String formatDateTimeForUrgentItems(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        try {
            return dateTime.format(DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm"));
        } catch (Exception e) {
            return null;
        }
    }

}
