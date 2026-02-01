package com.carepilot.repository.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;

public interface CallScheduleRepository extends JpaRepository<CallSchedule, Long> {
    // 특정 월의 스케줄 조회 (캘린더용)
    List<CallSchedule> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);

    // 예약된 통화 목록 조회 (여러 상태 허용)
    List<CallSchedule> findByStatusInOrderByScheduledTimeAsc(Collection<ScheduleStatus> statuses);

    /** 폴링용: 실행 시각이 도래한 스케줄 조회 (개인: care_target 있음 / 그룹: group_id 있음) */
    @Query("SELECT cs FROM CallSchedule cs " +
            "LEFT JOIN FETCH cs.careTarget " +
            "LEFT JOIN FETCH cs.group " +
            "WHERE cs.status = com.carepilot.domain.call.ScheduleStatus.SCHEDULED " +
            "AND (cs.nextRunAt IS NOT NULL AND cs.nextRunAt <= :now " +
            "     OR (cs.nextRunAt IS NULL AND cs.scheduledTime <= :now)) " +
            "AND (cs.careTarget IS NOT NULL OR cs.group IS NOT NULL) " +
            "ORDER BY COALESCE(cs.nextRunAt, cs.scheduledTime) ASC")
    List<CallSchedule> findDueSchedules(@Param("now") LocalDateTime now, Pageable pageable);

    //케어 그룹에서 그룹 통화 스케줄 조회
    @Query("SELECT cs FROM CallSchedule cs " +
            "WHERE cs.group.groupId = :groupId " +
            "AND cs.organization.organizationId = :organizationId " +
            "AND cs.targetType = com.carepilot.domain.call.ScheduleTargetType.GROUP " +
            "ORDER BY cs.createdAt DESC")
    List<CallSchedule> findAllByGroupIdAndOrgId(
            @Param("groupId") Long groupId,
            @Param("organizationId") Long organizationId);

    // Scenario 삭제 시 관련 CallSchedule의 scenario를 NULL로 설정
    @Modifying
    @Query("UPDATE CallSchedule cs SET cs.scenario = NULL WHERE cs.scenario.scenarioId = :scenarioId")
    void clearScenarioByScenarioId(@Param("scenarioId") Long scenarioId);
}
