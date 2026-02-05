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
}
