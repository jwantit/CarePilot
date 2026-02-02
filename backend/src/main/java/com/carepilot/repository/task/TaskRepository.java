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
}
