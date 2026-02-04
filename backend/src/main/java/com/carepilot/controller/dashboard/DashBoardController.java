package com.carepilot.controller.dashboard;

import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.service.call.CallService;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.service.task.TaskService;
import com.carepilot.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 대시보드 통계 API 컨트롤러
 * 대시보드 페이지에 필요한 통계 데이터를 제공합니다.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Log4j2
public class DashBoardController {

    private final CallService callService;
    private final CareService careService;
    private final TaskService taskService;
    private final NotificationService notificationService;

    /**
     * 대시보드 통계 데이터 조회
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID (알림 통계용)
     * @return 대시보드 통계 데이터
     */
    @GetMapping("/{organizationId}/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/stats 요청: userId={}", organizationId, userId);
        
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // 통화 통계
            Map<String, Object> callStats = calculateCallStats(organizationId);
            stats.put("callStats", callStats);
            
            // 위험 환자 통계
            Map<String, Object> riskStats = calculateRiskStats(organizationId);
            stats.put("riskStats", riskStats);
            
            // 작업 통계
            Map<String, Object> taskStats = calculateTaskStats();
            stats.put("taskStats", taskStats);
            
            // 알림 통계
            if (userId != null) {
                Map<String, Object> notificationStats = calculateNotificationStats(userId);
                stats.put("notificationStats", notificationStats);
            }
            
            // 배너 통계
            Map<String, Object> bannerStats = calculateBannerStats(organizationId, userId);
            stats.put("bannerStats", bannerStats);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("대시보드 통계 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 통화 통계 계산
     */
    private Map<String, Object> calculateCallStats(Long organizationId) {
        List<CallResponseDTO> callHistory = callService.getCallHistory(organizationId);
        
        int totalCalls = callHistory.size();
        long successCalls = callHistory.stream()
                .filter(call -> "SUCCESS".equals(call.getStatus()))
                .count();
        long failedCalls = callHistory.stream()
                .filter(call -> "FAILED".equals(call.getStatus()))
                .count();
        
        int successRate = totalCalls > 0 ? (int) Math.round((successCalls * 100.0) / totalCalls) : 0;
        
        // 최근 7일 vs 그 이전 7일 비교
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysAgo = now.minusDays(7);
        LocalDateTime fourteenDaysAgo = now.minusDays(14);
        
        List<CallResponseDTO> recentCalls = callHistory.stream()
                .filter(call -> {
                    if (call.getStartTime() == null) return false;
                    LocalDateTime callTime = parseDateTime(call.getStartTime());
                    return callTime != null && callTime.isAfter(sevenDaysAgo);
                })
                .collect(Collectors.toList());
        
        List<CallResponseDTO> previousCalls = callHistory.stream()
                .filter(call -> {
                    if (call.getStartTime() == null) return false;
                    LocalDateTime callTime = parseDateTime(call.getStartTime());
                    return callTime != null && callTime.isAfter(fourteenDaysAgo) && callTime.isBefore(sevenDaysAgo);
                })
                .collect(Collectors.toList());
        
        // 각 기간의 성공률 계산
        int recentTotal = recentCalls.size();
        long recentSuccess = recentCalls.stream()
                .filter(call -> "SUCCESS".equals(call.getStatus()))
                .count();
        double recentSuccessRate = recentTotal > 0 ? (recentSuccess * 100.0) / recentTotal : 0;
        
        int previousTotal = previousCalls.size();
        long previousSuccess = previousCalls.stream()
                .filter(call -> "SUCCESS".equals(call.getStatus()))
                .count();
        double previousSuccessRate = previousTotal > 0 ? (previousSuccess * 100.0) / previousTotal : 0;
        
        // 증가/감소율 계산
        int changeRate = 0;
        boolean isIncrease = true;
        
        if (previousTotal > 0 && previousSuccessRate >= 0) {
            changeRate = (int) Math.round(Math.abs(recentSuccessRate - previousSuccessRate));
            isIncrease = recentSuccessRate >= previousSuccessRate;
        } else if (recentTotal > 0 && previousTotal == 0) {
            changeRate = 0;
            isIncrease = true;
        }
        
        Map<String, Object> callStats = new HashMap<>();
        callStats.put("total", totalCalls);
        callStats.put("successRate", successRate);
        callStats.put("changeRate", changeRate);
        callStats.put("isIncrease", isIncrease);
        callStats.put("failedCalls", (int) failedCalls);
        
        return callStats;
    }

    /**
     * 위험 환자 통계 계산
     */
    private Map<String, Object> calculateRiskStats(Long organizationId) {
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
        riskStats.put("riskPatients", (int) riskPatients);
        
        return riskStats;
    }

    /**
     * 작업 통계 계산
     */
    private Map<String, Object> calculateTaskStats() {
        List<TaskListResponseDTO> tasks = taskService.getTaskList(null, null, null, null, null);
        
        int totalTasks = tasks.size();
        long waitingTasks = tasks.stream()
                .filter(task -> "WAITING".equals(task.getStatus()))
                .count();
        
        Map<String, Object> taskStats = new HashMap<>();
        taskStats.put("total", totalTasks);
        taskStats.put("waiting", (int) waitingTasks);
        
        return taskStats;
    }

    /**
     * 알림 통계 계산
     */
    private Map<String, Object> calculateNotificationStats(Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        
        int totalNotifications = notifications.size();
        long unprocessedNotifications = notifications.stream()
                .filter(notif -> notif.getStatus() != null && notif.getStatus() == NotificationStatus.ACTIVE)
                .count();
        
        Map<String, Object> notificationStats = new HashMap<>();
        notificationStats.put("total", totalNotifications);
        notificationStats.put("unprocessed", (int) unprocessedNotifications);
        
        return notificationStats;
    }

    /**
     * 배너 통계 계산
     */
    private Map<String, Object> calculateBannerStats(Long organizationId, Long userId) {
        Map<String, Object> bannerStats = new HashMap<>();
        
        // 통화 실패 건수
        List<CallResponseDTO> callHistory = callService.getCallHistory(organizationId);
        long failedCalls = callHistory.stream()
                .filter(call -> "FAILED".equals(call.getStatus()))
                .count();
        bannerStats.put("failedCalls", (int) failedCalls);
        
        // 위험 환자 수
        List<CareTargetListResponseDTO> careTargets = careService.getCareTargetList(organizationId, "");
        long riskPatients = careTargets.stream()
                .filter(patient -> {
                    if (patient.getRiskLevel() == null) return false;
                    String riskLevel = patient.getRiskLevel().name();
                    return "HIGH".equals(riskLevel) || "CRITICAL".equals(riskLevel);
                })
                .count();
        bannerStats.put("riskPatients", (int) riskPatients);
        
        // 긴급 알림 건수
        if (userId != null) {
            List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
            long urgentAlerts = notifications.stream()
                    .filter(notif -> {
                        if (notif.getSeverity() == null) return false;
                        String severity = notif.getSeverity().name();
                        return "CRITICAL".equals(severity) || "HIGH".equals(severity);
                    })
                    .count();
            bannerStats.put("urgentAlerts", (int) urgentAlerts);
        } else {
            bannerStats.put("urgentAlerts", 0);
        }
        
        return bannerStats;
    }

    /**
     * 날짜 문자열을 LocalDateTime으로 변환
     */
    private LocalDateTime parseDateTime(String dateString) {
        if (dateString == null || dateString.isEmpty()) {
            return null;
        }
        try {
            // "yyyy-MM-dd HH:mm:ss" 형식 처리
            java.time.format.DateTimeFormatter formatter = 
                java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            return LocalDateTime.parse(dateString, formatter);
        } catch (Exception e) {
            log.warn("날짜 파싱 실패: {}", dateString);
            return null;
        }
    }

    /**
     * 긴급 환자 목록 조회 (risk_level이 CRITICAL인 케어 대상자)
     * 
     * @param organizationId 조직 ID
     * @return 긴급 환자 목록
     */
    @GetMapping("/{organizationId}/urgent-patients")
    public ResponseEntity<List<CareTargetListResponseDTO>> getUrgentPatients(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/urgent-patients 요청", organizationId);
        
        try {
            List<CareTargetListResponseDTO> careTargets = careService.getCareTargetList(organizationId, "");
            
            // risk_level이 CRITICAL인 환자만 필터링하고 위험도 점수 높은 순으로 정렬
            List<CareTargetListResponseDTO> urgentPatients = careTargets.stream()
                    .filter(patient -> {
                        if (patient.getRiskLevel() == null) return false;
                        return "CRITICAL".equals(patient.getRiskLevel().name());
                    })
                    .sorted((a, b) -> {
                        // riskScore가 높은 순으로 정렬 (내림차순)
                        int scoreA = a.getRiskScore();
                        int scoreB = b.getRiskScore();
                        return Integer.compare(scoreB, scoreA);
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(urgentPatients);
        } catch (Exception e) {
            log.error("긴급 환자 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 대기 중인 작업 목록 조회 (status가 WAITING인 작업)
     * 
     * @param organizationId 조직 ID
     * @return 대기 중인 작업 목록
     */
    @GetMapping("/{organizationId}/waiting-tasks")
    public ResponseEntity<List<TaskListResponseDTO>> getWaitingTasks(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/waiting-tasks 요청", organizationId);
        
        try {
            // status가 WAITING인 작업만 필터링
            List<TaskListResponseDTO> allTasks = taskService.getTaskList(null, "WAITING", null, null, null);
            
            return ResponseEntity.ok(allTasks);
        } catch (Exception e) {
            log.error("대기 중인 작업 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 진행 중인 작업 목록 조회 (완료되지 않은 작업, 즉 DONE, SUCCESS, FAILED가 아닌 모든 작업)
     * 
     * @param organizationId 조직 ID
     * @return 진행 중인 작업 목록
     */
    @GetMapping("/{organizationId}/in-progress-tasks")
    public ResponseEntity<List<TaskListResponseDTO>> getInProgressTasks(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/in-progress-tasks 요청", organizationId);
        
        try {
            // 모든 작업 조회 (status 필터 없이)
            List<TaskListResponseDTO> allTasks = taskService.getTaskList(null, null, null, null, null);
            
            // 완료되지 않은 작업만 필터링하고 우선순위 높은 순, 같으면 마감일 근접한 순으로 정렬
            Map<String, Integer> priorityOrder = Map.of("URGENT", 4, "HIGH", 3, "MEDIUM", 2, "LOW", 1);
            List<TaskListResponseDTO> inProgressTasks = allTasks.stream()
                    .filter(task -> {
                        if (task.getStatus() == null) return true; // 상태가 없으면 포함
                        String status = task.getStatus();
                        // 완료 상태가 아닌 모든 작업 포함
                        return !"DONE".equals(status) && !"SUCCESS".equals(status) && !"FAILED".equals(status);
                    })
                    .sorted((a, b) -> {
                        // 우선순위 순서: URGENT(4) > HIGH(3) > MEDIUM(2) > LOW(1)
                        int aPriority = priorityOrder.getOrDefault(a.getPriority(), 0);
                        int bPriority = priorityOrder.getOrDefault(b.getPriority(), 0);
                        
                        // 우선순위가 다르면 우선순위 높은 순으로 정렬
                        if (aPriority != bPriority) {
                            return Integer.compare(bPriority, aPriority); // 내림차순
                        }
                        
                        // 우선순위가 같으면 마감일이 더 근접한 순으로 정렬
                        if (a.getDueDate() == null && b.getDueDate() == null) return 0;
                        if (a.getDueDate() == null) return 1;
                        if (b.getDueDate() == null) return -1;
                        
                        return a.getDueDate().compareTo(b.getDueDate()); // 오름차순
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(inProgressTasks);
        } catch (Exception e) {
            log.error("진행 중인 작업 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 긴급 알림 목록 조회 (severity가 CRITICAL 또는 HIGH이고 status가 ACTIVE인 알림)
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID
     * @return 긴급 알림 목록
     */
    @GetMapping("/{organizationId}/urgent-notifications")
    public ResponseEntity<List<Notification>> getUrgentNotifications(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/urgent-notifications 요청: userId={}", organizationId, userId);
        
        try {
            List<Notification> allNotifications;
            if (userId != null) {
                allNotifications = notificationService.getNotificationsByUserId(userId);
            } else {
                // userId가 없으면 빈 리스트 반환 (조직 전체 알림 조회는 별도 구현 필요)
                allNotifications = new ArrayList<>();
            }
            
            // severity가 CRITICAL 또는 HIGH이고 status가 ACTIVE인 알림만 필터링
            List<Notification> urgentNotifications = allNotifications.stream()
                    .filter(notif -> {
                        if (notif.getSeverity() == null || notif.getStatus() == null) return false;
                        String severity = notif.getSeverity().name();
                        String status = notif.getStatus().name();
                        return ("CRITICAL".equals(severity) || "HIGH".equals(severity))
                                && "ACTIVE".equals(status);
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(urgentNotifications);
        } catch (Exception e) {
            log.error("긴급 알림 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 오늘의 일정 조회 (오늘 날짜의 스케줄)
     * 
     * @param organizationId 조직 ID
     * @return 오늘의 일정 목록
     */
    @GetMapping("/{organizationId}/today-schedules")
    public ResponseEntity<List<ScheduleResponseDTO>> getTodaySchedules(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/today-schedules 요청", organizationId);
        
        try {
            // 오늘 날짜 정보
            LocalDateTime now = LocalDateTime.now();
            int year = now.getYear();
            int month = now.getMonthValue();
            
            // 이번 달의 스케줄 조회
            List<ScheduleResponseDTO> monthSchedules = callService.getSchedulesByMonth(organizationId, year, month);
            
            // 오늘 날짜의 스케줄만 필터링
            String todayDateStr = String.format("%04d-%02d-%02d", year, month, now.getDayOfMonth());
            List<ScheduleResponseDTO> todaySchedules = monthSchedules.stream()
                    .filter(schedule -> {
                        if (schedule.getScheduledTime() == null) return false;
                        return schedule.getScheduledTime().startsWith(todayDateStr);
                    })
                    .collect(Collectors.toList());
            
            // 우선순위 높은 순, 같으면 시작시간 빠른 순으로 정렬
            Map<String, Integer> priorityOrder = Map.of("URGENT", 4, "HIGH", 3, "MEDIUM", 2, "LOW", 1);
            todaySchedules.sort((a, b) -> {
                // 우선순위 순서: URGENT(4) > HIGH(3) > MEDIUM(2) > LOW(1)
                int aPriority = priorityOrder.getOrDefault(a.getPriority(), 0);
                int bPriority = priorityOrder.getOrDefault(b.getPriority(), 0);
                
                // 우선순위가 다르면 우선순위 높은 순으로 정렬
                if (aPriority != bPriority) {
                    return Integer.compare(bPriority, aPriority); // 내림차순
                }
                
                // 우선순위가 같으면 시작시간이 빠른 순으로 정렬
                String aTimeStr = a.getScheduledTime() != null ? a.getScheduledTime() : a.getNextRunAt();
                String bTimeStr = b.getScheduledTime() != null ? b.getScheduledTime() : b.getNextRunAt();
                
                if (aTimeStr == null && bTimeStr == null) return 0;
                if (aTimeStr == null) return 1;
                if (bTimeStr == null) return -1;
                
                return aTimeStr.compareTo(bTimeStr);
            });
            
            return ResponseEntity.ok(todaySchedules);
        } catch (Exception e) {
            log.error("오늘의 일정 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
}

