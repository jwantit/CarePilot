package com.carepilot.controller.dashboard;

import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.domain.notification.Notification;
import com.carepilot.service.dashBoard.DashBoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 대시보드 통계 API 컨트롤러
 * 대시보드 페이지에 필요한 통계 데이터를 제공합니다.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Log4j2
public class DashBoardController {

    private final DashBoardService dashBoardService;

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
            stats.put("callStats", dashBoardService.calculateCallStats(organizationId));
            
            // 위험 환자 통계
            stats.put("riskStats", dashBoardService.calculateRiskStats(organizationId));
            
            // 작업 통계
            stats.put("taskStats", dashBoardService.calculateTaskStats());
            
            // 알림 통계
            if (userId != null) {
                stats.put("notificationStats", dashBoardService.calculateNotificationStats(userId));
            }
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("대시보드 통계 조회 실패: {}", e.getMessage(), e);
            throw e;
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
        return ResponseEntity.ok(dashBoardService.getUrgentPatients(organizationId));
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
        return ResponseEntity.ok(dashBoardService.getWaitingTasks(organizationId));
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
        return ResponseEntity.ok(dashBoardService.getUrgentWaitingTasks(organizationId));
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
        return ResponseEntity.ok(dashBoardService.getInProgressTasks(organizationId));
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
        return ResponseEntity.ok(dashBoardService.getUrgentNotifications(organizationId, userId));
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
        return ResponseEntity.ok(dashBoardService.getTodaySchedules(organizationId));
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
        return ResponseEntity.ok(dashBoardService.getRecentNotifications(organizationId, userId));
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
        return ResponseEntity.ok(dashBoardService.getRecentTasks(organizationId));
    }

    /**
     * 즉시 조치 필요 항목 통합 조회 (환자+작업+알림, 최신순 정렬, 최대 5개)
     * 
     * @param organizationId 조직 ID
     * @param userId 사용자 ID
     * @return 즉시 조치 필요 항목 목록 (최신순 정렬, 최대 5개)
     */
    @GetMapping("/{organizationId}/urgent-items")
    public ResponseEntity<List<Map<String, Object>>> getUrgentItems(
            @PathVariable Long organizationId,
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/dashboard/{}/urgent-items 요청: userId={}", organizationId, userId);
        return ResponseEntity.ok(dashBoardService.getUrgentItems(organizationId, userId));
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
        return ResponseEntity.ok(dashBoardService.getRecentItems(organizationId, userId));
    }
}


