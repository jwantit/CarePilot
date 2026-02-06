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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("대시보드 통계 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 통화 통계 계산 (오늘 데이터만 계산)
     */
    private Map<String, Object> calculateCallStats(Long organizationId) {
        List<CallResponseDTO> callHistory = callService.getCallHistory(organizationId);
        LocalDateTime now = LocalDateTime.now();

        // 오늘 시간 범위 설정
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);

        // 디버깅: 전체 통화 이력 로그
        log.info("전체 통화 이력 조회: {}건", callHistory.size());
        callHistory.forEach(call -> {
            log.info("통화 정보: callId={}, startTime={}, status={}",
                    call.getCallId(), call.getStartTime(), call.getStatus());
        });

        // 오늘 데이터 계산
        List<CallResponseDTO> todayCalls = filterCallsByDate(callHistory, todayStart, todayEnd);
        log.info("오늘 통화 필터링: {}건 (범위: {} ~ {})", 
                todayCalls.size(), todayStart, todayEnd);
        
        int todayTotal = todayCalls.size();
        long todaySuccess = todayCalls.stream().filter(c -> "SUCCESS".equals(c.getStatus())).count();
        int todaySuccessRate = todayTotal > 0 ? (int) Math.round((todaySuccess * 100.0) / todayTotal) : 0;

        // Map에 담기
        Map<String, Object> callStats = new HashMap<>();
        callStats.put("todayTotal", todayTotal);
        callStats.put("todaySuccessRate", todaySuccessRate);

        log.info("통화 통계: 오늘 {}건(성공률 {}%)", todayTotal, todaySuccessRate);

        return callStats;
    }

    /**
     * 중복 로직 방지를 위한 헬퍼 메서드
     */
    private List<CallResponseDTO> filterCallsByDate(List<CallResponseDTO> history, LocalDateTime start, LocalDateTime end) {
        return history.stream()
                .filter(call -> {
                    if (call.getStartTime() == null) {
                        log.warn("startTime이 null인 통화 건 발견: callId={}", call.getCallId());
                        return false;
                    }
                    LocalDateTime callTime = parseDateTime(call.getStartTime());
                    if (callTime == null) {
                        log.warn("startTime 파싱 실패: callId={}, startTime={}", call.getCallId(), call.getStartTime());
                        return false;
                    }
                    boolean isInRange = !callTime.isBefore(start) && !callTime.isAfter(end);
                    if (!isInRange) {
                        log.debug("통화 날짜 범위 밖: callId={}, callTime={}, 범위={} ~ {}", 
                                call.getCallId(), callTime, start, end);
                    }
                    return isInRange;
                })
                .collect(Collectors.toList());
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
        
        return riskStats;
    }

    /**
     * 작업 통계 계산 (오늘 날짜 기준 - 오늘 생성된 작업만)
     */
    private Map<String, Object> calculateTaskStats() {
        List<TaskListResponseDTO> tasks = taskService.getTaskList(null, null, null, null, null);
        
        // 오늘 날짜 필터링
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        
        List<TaskListResponseDTO> todayTasks = tasks.stream()
                .filter(task -> {
                    if (task.getCreatedAt() == null) return false;
                    LocalDateTime createdAt = task.getCreatedAt();
                    return !createdAt.isBefore(startOfDay) && !createdAt.isAfter(endOfDay);
                })
                .collect(Collectors.toList());
        
        int totalTasks = todayTasks.size();
        long waitingTasks = todayTasks.stream()
                .filter(task -> "WAITING".equals(task.getStatus()))
                .count();
        
        Map<String, Object> taskStats = new HashMap<>();
        taskStats.put("total", totalTasks);
        taskStats.put("waiting", (int) waitingTasks);
        
        return taskStats;
    }

    /**
     * 알림 통계 계산 (오늘 날짜 기준 - 오늘 발생한 알림만)
     */
    private Map<String, Object> calculateNotificationStats(Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        
        // 오늘 날짜 필터링
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        
        List<Notification> todayNotifications = notifications.stream()
                .filter(notif -> {
                    if (notif.getOccurredAt() == null) return false;
                    LocalDateTime occurredAt = notif.getOccurredAt();
                    return !occurredAt.isBefore(startOfDay) && !occurredAt.isAfter(endOfDay);
                })
                .collect(Collectors.toList());
        
        int totalNotifications = todayNotifications.size();
        long unprocessedNotifications = todayNotifications.stream()
                .filter(notif -> notif.getStatus() != null && notif.getStatus() == NotificationStatus.ACTIVE)
                .count();
        
        Map<String, Object> notificationStats = new HashMap<>();
        notificationStats.put("total", totalNotifications);
        notificationStats.put("unprocessed", (int) unprocessedNotifications);
        
        return notificationStats;
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
     * 날짜를 "yyyy.MM.dd HH:mm" 형식으로 포맷팅 (즉시 조치 필요 박스용)
     */
    private String formatDateTimeForUrgentItems(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");
            return dateTime.format(formatter);
        } catch (Exception e) {
            log.warn("날짜 포맷팅 실패: {}", dateTime);
            return null;
        }
    }

    /**
     * 시간을 "오전/오후 HH:mm" 형식으로 포맷팅 (4번 박스용)
     */
    private String formatTimeForDisplay(String timeStr) {
        if (timeStr == null || timeStr.isEmpty()) return null;
        try {
            // "yyyy-MM-dd HH:mm" 형식 파싱
            DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            LocalDateTime dateTime = LocalDateTime.parse(timeStr, inputFormatter);
            
            int hour = dateTime.getHour();
            String ampm = hour >= 12 ? "오후" : "오전";
            int displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
            int minute = dateTime.getMinute();
            
            return String.format("%s %d:%02d", ampm, displayHour, minute);
        } catch (Exception e) {
            log.warn("시간 포맷팅 실패: {}", timeStr);
            return null;
        }
    }

    /**
     * 스케줄 상태 계산 (예정/진행 중/완료됨)
     */
    private String calculateScheduleStatus(ScheduleResponseDTO schedule) {
        if (schedule.getStatus() != null && "COMPLETED".equals(schedule.getStatus())) {
            return "[완료됨✓]";
        }
        
        if (schedule.getScheduledTime() == null) {
            return "[예정]";
        }
        
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            LocalDateTime scheduledDate = LocalDateTime.parse(schedule.getScheduledTime(), formatter);
            LocalDateTime now = LocalDateTime.now();
            
            if (now.isAfter(scheduledDate) || now.isEqual(scheduledDate)) {
                return "[진행 중..]";
            }
            return "[예정]";
        } catch (Exception e) {
            log.warn("스케줄 상태 계산 실패: {}", schedule.getScheduledTime());
            return "[예정]";
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
     * 긴급 대기 중인 작업 목록 조회 (status가 WAITING이고 priority가 URGENT인 작업)
     * 
     * @param organizationId 조직 ID
     * @return 긴급 대기 중인 작업 목록
     */
    @GetMapping("/{organizationId}/urgent-waiting-tasks")
    public ResponseEntity<List<TaskListResponseDTO>> getUrgentWaitingTasks(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/urgent-waiting-tasks 요청", organizationId);
        
        try {
            // status가 WAITING인 작업만 필터링
            List<TaskListResponseDTO> allTasks = taskService.getTaskList(null, "WAITING", null, null, null);
            
            // priority가 URGENT인 작업만 필터링
            List<TaskListResponseDTO> urgentWaitingTasks = allTasks.stream()
                    .filter(task -> "URGENT".equals(task.getPriority()))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(urgentWaitingTasks);
        } catch (Exception e) {
            log.error("긴급 대기 중인 작업 목록 조회 실패: {}", e.getMessage(), e);
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
     * @return 오늘의 일정 목록 (포맷된 시간과 상태 포함)
     */
    @GetMapping("/{organizationId}/today-schedules")
    public ResponseEntity<List<Map<String, Object>>> getTodaySchedules(
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
            
            // 최대 5개로 제한
            List<ScheduleResponseDTO> limitedSchedules = todaySchedules.stream()
                    .limit(5)
                    .collect(Collectors.toList());
            
            // ScheduleResponseDTO를 Map으로 변환하여 포맷된 필드 추가
            List<Map<String, Object>> result = limitedSchedules.stream()
                    .map(schedule -> {
                        Map<String, Object> scheduleMap = new HashMap<>();
                        scheduleMap.put("scheduleId", schedule.getScheduleId());
                        scheduleMap.put("careTargetId", schedule.getCareTargetId());
                        scheduleMap.put("scheduledTime", schedule.getScheduledTime());
                        scheduleMap.put("nextRunAt", schedule.getNextRunAt());
                        scheduleMap.put("careTargetName", schedule.getCareTargetName());
                        scheduleMap.put("targetGroupName", schedule.getTargetGroupName());
                        scheduleMap.put("status", schedule.getStatus());
                        scheduleMap.put("priority", schedule.getPriority());
                        // 포맷된 시간 추가
                        String timeStr = schedule.getScheduledTime() != null 
                                ? schedule.getScheduledTime() 
                                : schedule.getNextRunAt();
                        scheduleMap.put("formattedTime", formatTimeForDisplay(timeStr));
                        // 계산된 상태 추가
                        scheduleMap.put("displayStatus", calculateScheduleStatus(schedule));
                        return scheduleMap;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("오늘의 일정 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 최근 알림 목록 조회 (긴급이 아닌 알림, 즉 CRITICAL과 HIGH 제외)
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID
     * @return 최근 알림 목록
     */
    @GetMapping("/{organizationId}/recent-notifications")
    public ResponseEntity<List<Notification>> getRecentNotifications(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/recent-notifications 요청: userId={}", organizationId, userId);
        
        try {
            List<Notification> allNotifications;
            if (userId != null) {
                allNotifications = notificationService.getNotificationsByUserId(userId);
            } else {
                allNotifications = new ArrayList<>();
            }
            
            // 긴급이 아닌 알림만 필터링 (CRITICAL, HIGH 제외)
            List<Notification> recentNotifications = allNotifications.stream()
                    .filter(notif -> {
                        if (notif.getSeverity() == null || notif.getStatus() == null) return false;
                        String severity = notif.getSeverity().name();
                        String status = notif.getStatus().name();
                        // CRITICAL, HIGH가 아니고 ACTIVE 상태인 알림만 포함
                        return !"CRITICAL".equals(severity) && !"HIGH".equals(severity)
                                && "ACTIVE".equals(status);
                    })
                    .sorted((a, b) -> {
                        // 최근 발생한 순으로 정렬 (내림차순)
                        if (a.getOccurredAt() == null && b.getOccurredAt() == null) return 0;
                        if (a.getOccurredAt() == null) return 1;
                        if (b.getOccurredAt() == null) return -1;
                        return b.getOccurredAt().compareTo(a.getOccurredAt());
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(recentNotifications);
        } catch (Exception e) {
            log.error("최근 알림 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 최근 작업 목록 조회 (긴급이 아니고 완료되지 않은 작업, 즉 URGENT 제외, DONE/SUCCESS/FAILED 제외)
     * 
     * @param organizationId 조직 ID
     * @return 최근 작업 목록
     */
    @GetMapping("/{organizationId}/recent-tasks")
    public ResponseEntity<List<TaskListResponseDTO>> getRecentTasks(
            @PathVariable Long organizationId) {
        log.info("GET /api/dashboard/{}/recent-tasks 요청", organizationId);
        
        try {
            // 모든 작업 조회 (status 필터 없이)
            List<TaskListResponseDTO> allTasks = taskService.getTaskList(null, null, null, null, null);
            
            // 긴급이 아니고 완료되지 않은 작업만 필터링
            List<TaskListResponseDTO> recentTasks = allTasks.stream()
                    .filter(task -> {
                        if (task.getStatus() == null) return false;
                        String status = task.getStatus();
                        String priority = task.getPriority();
                        // URGENT가 아니고 완료 상태가 아닌 작업만 포함
                        return !"URGENT".equals(priority)
                                && !"DONE".equals(status) && !"SUCCESS".equals(status) && !"FAILED".equals(status);
                    })
                    .sorted((a, b) -> {
                        // 마감일이 가장 빠른 순으로 정렬 (오름차순)
                        if (a.getDueDate() == null && b.getDueDate() == null) return 0;
                        if (a.getDueDate() == null) return 1; // 마감일이 없는 것은 뒤로
                        if (b.getDueDate() == null) return -1; // 마감일이 없는 것은 뒤로
                        return a.getDueDate().compareTo(b.getDueDate()); // 오름차순 (빠른 마감일이 먼저)
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(recentTasks);
        } catch (Exception e) {
            log.error("최근 작업 목록 조회 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 즉시 조치 필요 항목 통합 조회 (환자+작업+알림, 시간 정렬, 최대 5개)
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID
     * @return 즉시 조치 필요 항목 목록 (시간 순 정렬, 최대 5개)
     */
    @GetMapping("/{organizationId}/urgent-items")
    public ResponseEntity<List<Map<String, Object>>> getUrgentItems(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/urgent-items 요청: userId={}", organizationId, userId);
        
        try {
            List<Map<String, Object>> items = new ArrayList<>();
            
            // 긴급 환자 목록 (내부 로직 직접 사용)
            List<CareTargetListResponseDTO> careTargets = careService.getCareTargetList(organizationId, "");
            List<CareTargetListResponseDTO> urgentPatients = careTargets.stream()
                    .filter(patient -> {
                        if (patient.getRiskLevel() == null) return false;
                        return "CRITICAL".equals(patient.getRiskLevel().name());
                    })
                    .sorted((a, b) -> {
                        int scoreA = a.getRiskScore();
                        int scoreB = b.getRiskScore();
                        return Integer.compare(scoreB, scoreA);
                    })
                    .collect(Collectors.toList());
            
            if (urgentPatients != null && !urgentPatients.isEmpty()) {
                for (CareTargetListResponseDTO patient : urgentPatients) {
                    try {
                        Map<String, Object> item = new HashMap<>();
                        item.put("type", "patient");
                        item.put("data", patient);
                        item.put("time", patient.getRiskCalculatedAt());
                        // 포맷된 날짜 추가 (yyyy.MM.dd HH:mm 형식)
                        item.put("formattedTime", formatDateTimeForUrgentItems(patient.getRiskCalculatedAt()));
                        items.add(item);
                    } catch (Exception e) {
                        log.warn("환자 데이터 처리 중 오류: {}", e.getMessage());
                    }
                }
            }
            
            // 긴급 대기 중인 작업 목록 (내부 로직 직접 사용)
            List<TaskListResponseDTO> allWaitingTasks = taskService.getTaskList(null, "WAITING", null, null, null);
            List<TaskListResponseDTO> urgentWaitingTasks = allWaitingTasks.stream()
                    .filter(task -> "URGENT".equals(task.getPriority()))
                    .collect(Collectors.toList());
            
            if (urgentWaitingTasks != null && !urgentWaitingTasks.isEmpty()) {
                for (TaskListResponseDTO task : urgentWaitingTasks) {
                    try {
                        Map<String, Object> item = new HashMap<>();
                        item.put("type", "task");
                        item.put("data", task);
                        item.put("time", task.getCreatedAt());
                        // 포맷된 날짜 추가 (yyyy.MM.dd HH:mm 형식)
                        item.put("formattedTime", formatDateTimeForUrgentItems(task.getCreatedAt()));
                        items.add(item);
                    } catch (Exception e) {
                        log.warn("작업 데이터 처리 중 오류: {}", e.getMessage());
                    }
                }
            }
            
            // 긴급 알림 목록 (내부 로직 직접 사용)
            List<Notification> allNotifications = new ArrayList<>();
            if (userId != null) {
                allNotifications = notificationService.getNotificationsByUserId(userId);
            }
            List<Notification> urgentNotifications = allNotifications.stream()
                    .filter(notif -> {
                        if (notif.getSeverity() == null || notif.getStatus() == null) return false;
                        String severity = notif.getSeverity().name();
                        String status = notif.getStatus().name();
                        return ("CRITICAL".equals(severity) || "HIGH".equals(severity))
                                && "ACTIVE".equals(status);
                    })
                    .collect(Collectors.toList());
            
            if (urgentNotifications != null && !urgentNotifications.isEmpty()) {
                for (Notification notification : urgentNotifications) {
                    try {
                        Map<String, Object> item = new HashMap<>();
                        item.put("type", "notification");
                        item.put("data", notification);
                        item.put("time", notification.getOccurredAt());
                        // 포맷된 날짜 추가 (yyyy.MM.dd HH:mm 형식)
                        item.put("formattedTime", formatDateTimeForUrgentItems(notification.getOccurredAt()));
                        items.add(item);
                    } catch (Exception e) {
                        log.warn("알림 데이터 처리 중 오류: {}", e.getMessage());
                    }
                }
            }
            
            log.info("즉시 조치 필요 항목 수집: 환자 {}개, 작업 {}개, 알림 {}개, 총 {}개", 
                    urgentPatients != null ? urgentPatients.size() : 0,
                    urgentWaitingTasks != null ? urgentWaitingTasks.size() : 0,
                    urgentNotifications != null ? urgentNotifications.size() : 0,
                    items.size());
            
            // 시간 기준으로 정렬 (오래된 데이터가 상단)
            items.sort((a, b) -> {
                LocalDateTime timeA = (LocalDateTime) a.get("time");
                LocalDateTime timeB = (LocalDateTime) b.get("time");
                
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                
                return timeA.compareTo(timeB); // 오름차순 (오래된 것이 먼저)
            });
            
            // 최대 5개로 제한
            List<Map<String, Object>> limitedItems = items.stream()
                    .limit(5)
                    .collect(Collectors.toList());
            
            log.info("즉시 조치 필요 항목 최종 반환: {}개", limitedItems.size());
            return ResponseEntity.ok(limitedItems);
        } catch (Exception e) {
            log.error("즉시 조치 필요 항목 조회 실패: {}", e.getMessage(), e);
            e.printStackTrace();
            // 빈 리스트 반환하여 500 에러 방지
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 최근 활동 통합 조회 (작업만, 마감일 기준 정렬, 최대 5개)
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID
     * @return 최근 활동 목록 (작업만, 마감일 기준 정렬, 최대 5개)
     */
    @GetMapping("/{organizationId}/recent-items")
    public ResponseEntity<List<Map<String, Object>>> getRecentItems(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/recent-items 요청: userId={}", organizationId, userId);
        
        try {
            List<Map<String, Object>> items = new ArrayList<>();
            
            // 대기 상태 작업만 먼저 조회
            List<TaskListResponseDTO> waitingTasks = taskService.getTaskList(null, "WAITING", null, null, null);
            // 진행중 상태 작업만 먼저 조회
            List<TaskListResponseDTO> inProgressTasks = taskService.getTaskList(null, "IN_PROGRESS", null, null, null);
            
            // 두 리스트를 합치고 URGENT 제외 필터링
            List<TaskListResponseDTO> recentTasks = new ArrayList<>();
            recentTasks.addAll(waitingTasks);
            recentTasks.addAll(inProgressTasks);
            
            // URGENT 우선순위 제외
            recentTasks = recentTasks.stream()
                    .filter(task -> {
                        if (task.getPriority() == null) return true;
                        return !"URGENT".equals(task.getPriority());
                    })
                    .collect(Collectors.toList());
            
            // 작업을 Map으로 변환 (동일 taskId 중복 방지)
            Set<Long> processedTaskIds = new HashSet<>();
            for (TaskListResponseDTO task : recentTasks) {
                // 이미 처리한 taskId는 건너뛰기
                if (task.getTaskId() != null && processedTaskIds.contains(task.getTaskId())) {
                    continue;
                }
                
                Map<String, Object> item = new HashMap<>();
                item.put("type", "task");
                item.put("data", task);
                items.add(item);
                
                // 처리한 taskId 기록
                if (task.getTaskId() != null) {
                    processedTaskIds.add(task.getTaskId());
                }
            }
            
            // 마감일 기준 정렬 (과거는 오래된 순, 미래는 가까운 순)
            LocalDateTime now = LocalDateTime.now();
            items.sort((a, b) -> {
                TaskListResponseDTO taskA = (TaskListResponseDTO) a.get("data");
                TaskListResponseDTO taskB = (TaskListResponseDTO) b.get("data");
                
                LocalDateTime dueDateA = taskA.getDueDate();
                LocalDateTime dueDateB = taskB.getDueDate();
                
                // null 처리
                if (dueDateA == null && dueDateB == null) return 0;
                if (dueDateA == null) return 1;
                if (dueDateB == null) return -1;
                
                // 오늘과의 관계 확인
                boolean isPastA = dueDateA.isBefore(now);
                boolean isPastB = dueDateB.isBefore(now);
                
                // 둘 다 과거인 경우: 더 오래된 것부터 (오름차순)
                if (isPastA && isPastB) {
                    return dueDateA.compareTo(dueDateB);
                }
                // 둘 다 미래인 경우: 더 가까운 것부터 (오름차순)
                if (!isPastA && !isPastB) {
                    return dueDateA.compareTo(dueDateB);
                }
                // 하나는 과거, 하나는 미래: 과거를 먼저
                if (isPastA) return -1;
                return 1;
            });
            
            // 최대 5개로 제한
            List<Map<String, Object>> limitedItems = items.stream()
                    .limit(5)
                    .collect(Collectors.toList());
            
            log.info("최근 활동 항목 최종 반환: 작업 {}개", limitedItems.size());
            return ResponseEntity.ok(limitedItems);
        } catch (Exception e) {
            log.error("최근 활동 조회 실패: {}", e.getMessage(), e);
            e.printStackTrace();
            // 빈 리스트 반환하여 500 에러 방지
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}

