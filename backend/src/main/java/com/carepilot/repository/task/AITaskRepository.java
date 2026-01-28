package com.carepilot.repository.task;

import com.carepilot.domain.task.AITask;
import com.carepilot.domain.task.AITaskStatus;
import com.carepilot.domain.task.AITaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AITaskRepository extends JpaRepository<AITask, Long> {

    Optional<AITask> findByAiTaskId(Long aiTaskId);

    @Query("SELECT a FROM AITask a WHERE a.organization.organizationId = :orgId " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:taskType IS NULL OR a.taskType = :taskType) " +
            "ORDER BY a.createdAt DESC")
    List<AITask> findByOrganizationAndFilters(
            @Param("orgId") Long orgId,
            @Param("status") AITaskStatus status,
            @Param("taskType") AITaskType taskType);
}
