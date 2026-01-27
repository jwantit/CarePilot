package com.carepilot.service.call;

import com.carepilot.dto.call.*;

import java.util.List;

public interface CallService {
    // 탭 1: 통화 이력 관련
    List<CallResponseDTO> getCallHistory();
    CallDetailResponseDTO getCallDetail(Long callId);

    // 탭 2: 통화 스케줄 관련
    List<ScheduleResponseDTO> getSchedulesByMonth(int year, int month);
    List<ScheduleResponseDTO> getUpcomingSchedules();
    Long createSchedule(ScheduleCreateRequestDTO dto);
    void updateSchedule(Long scheduleId, ScheduleUpdateRequestDTO dto);
    void deleteSchedule(Long scheduleId);
    void restoreSchedule(Long scheduleId);
}
