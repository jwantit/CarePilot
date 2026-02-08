package com.carepilot.repository.task;

import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Optional<Task> findByTaskId(Long taskId);

    List<Task> findByCall_CallId(Long callId);

    @Query("SELECT t FROM Task t WHERE t.organization.organizationId = :orgId " +
            "AND (:sourceType IS NULL OR t.sourceType = :sourceType) " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:priority IS NULL OR t.priority = :priority) " +
            "AND (:type IS NULL OR t.type = :type) " +
            "AND (:assignedToUserId IS NULL OR t.assignedTo.userId = :assignedToUserId) " +
            "ORDER BY t.createdAt DESC, t.taskId DESC")
    List<Task> findByOrganizationAndFilters(
            @Param("orgId") Long orgId,
            @Param("sourceType") TaskSourceType sourceType,
            @Param("status") TaskStatus status,
            @Param("priority") Priority priority,
            @Param("type") TaskType type,
            @Param("assignedToUserId") Long assignedToUserId);
    
    // 통계용 쿼리들
    @Query("SELECT t.status, COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.createdAt >= :startDate AND t.createdAt < :endDate " +
           "GROUP BY t.status")
    List<Object[]> countByOrganizationIdAndStatusGrouped(
            @Param("orgId") Long orgId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);
    
    @Query("SELECT t.priority, COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.createdAt >= :startDate AND t.createdAt < :endDate " +
           "GROUP BY t.priority")
    List<Object[]> countByOrganizationIdAndPriorityGrouped(
            @Param("orgId") Long orgId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);
    
    @Query("SELECT t.sourceType, COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.createdAt >= :startDate AND t.createdAt < :endDate " +
           "GROUP BY t.sourceType")
    List<Object[]> countByOrganizationIdAndSourceTypeGrouped(
            @Param("orgId") Long orgId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status = 'DONE' AND t.createdAt >= :startDate AND t.createdAt < :endDate")
    Long countCompletedTasks(@Param("orgId") Long orgId,
                              @Param("startDate") java.time.LocalDateTime startDate,
                              @Param("endDate") java.time.LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.createdAt >= :startDate AND t.createdAt < :endDate")
    Long countTotalTasks(@Param("orgId") Long orgId,
                        @Param("startDate") java.time.LocalDateTime startDate,
                        @Param("endDate") java.time.LocalDateTime endDate);
    
    // 필터 적용: 완료된 작업 수
    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status = 'DONE' AND t.createdAt >= :startDate AND t.createdAt < :endDate " +
           "AND (:careTargetIds IS NULL OR t.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR t.careTarget.disease = :disease)")
    Long countCompletedTasksWithFilters(
            @Param("orgId") Long orgId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);

    // 대시보드 전용 -----------------------------------------------------------
    
    // 1. 오늘 생성된 특정 상태의 작업 수 조회
    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND t.createdAt >= :startDate AND t.createdAt < :endDate")
    long countTodayTasksByStatus(@Param("orgId") Long orgId, 
                                @Param("status") TaskStatus status,
                                @Param("startDate") java.time.LocalDateTime startDate, 
                                @Param("endDate") java.time.LocalDateTime endDate);

    // 2. 최근 활동: 마감일 기준 정렬된 상위 5개 작업 (URGENT 제외, 완료 제외)
    @Query("SELECT t FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status NOT IN (com.carepilot.domain.task.TaskStatus.DONE, com.carepilot.domain.task.TaskStatus.SUCCESS, com.carepilot.domain.task.TaskStatus.FAILED) " +
           "AND (t.priority IS NULL OR t.priority != com.carepilot.domain.enums.Priority.URGENT) " +
           "ORDER BY CASE WHEN t.dueDate IS NULL THEN 1 ELSE 0 END, t.dueDate ASC")
    List<Task> findTop5RecentActivityTasks(@Param("orgId") Long orgId, Pageable pageable);

    // 3. 긴급 대기 작업 상위 5개
    @Query("SELECT t FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status = com.carepilot.domain.task.TaskStatus.WAITING " +
           "AND t.priority = com.carepilot.domain.enums.Priority.URGENT " +
           "ORDER BY t.createdAt DESC")
    List<Task> findTop5UrgentWaitingTasks(@Param("orgId") Long orgId, Pageable pageable);

    // 4. 대기 중인 작업 (상태 WAITING)
    @Query("SELECT t FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status = com.carepilot.domain.task.TaskStatus.WAITING " +
           "ORDER BY t.createdAt DESC")
    List<Task> findWaitingTasks(@Param("orgId") Long orgId, Pageable pageable);

    // 5. 진행 중인 작업 (완료 제외, 우선순위 및 마감일 순)
    @Query("SELECT t FROM Task t WHERE t.organization.organizationId = :orgId " +
           "AND t.status NOT IN (com.carepilot.domain.task.TaskStatus.DONE, com.carepilot.domain.task.TaskStatus.SUCCESS, com.carepilot.domain.task.TaskStatus.FAILED) " +
           "ORDER BY CASE t.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END ASC, " +
           "CASE WHEN t.dueDate IS NULL THEN 1 ELSE 0 END, t.dueDate ASC")
    List<Task> findInProgressTasks(@Param("orgId") Long orgId, Pageable pageable);

    // -----------------------------------------------------------------------
}
