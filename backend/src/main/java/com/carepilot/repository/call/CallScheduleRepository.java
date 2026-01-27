package com.carepilot.repository.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CallScheduleRepository extends JpaRepository<CallSchedule, Long> {
    // 특정 월의 스케줄 조회 (캘린더용)
    List<CallSchedule> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);

    // 예약된 통화 목록 조회
    List<CallSchedule> findByStatusOrderByScheduledTimeAsc(ScheduleStatus status);
}
