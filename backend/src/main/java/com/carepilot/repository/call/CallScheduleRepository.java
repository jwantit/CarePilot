package com.carepilot.repository.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface CallScheduleRepository extends JpaRepository<CallSchedule, Long> {
    // 특정 월의 스케줄 조회 (캘린더용)
    List<CallSchedule> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);

    // 예약된 통화 목록 조회 (여러 상태 허용)
    List<CallSchedule> findByStatusInOrderByScheduledTimeAsc(Collection<ScheduleStatus> statuses);



    //케어 그룹에서 그룹 통화 스케줄 조회
    @Query("SELECT cs FROM CallSchedule cs " +
            "WHERE cs.group.groupId = :groupId " +
            "AND cs.organization.organizationId = :organizationId " +
            "AND cs.targetType = com.carepilot.domain.call.ScheduleTargetType.GROUP " +
            "ORDER BY cs.createdAt DESC")
    List<CallSchedule> findAllByGroupIdAndOrgId(
            @Param("groupId") Long groupId,
            @Param("organizationId") Long organizationId);
}
