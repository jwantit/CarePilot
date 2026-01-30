package com.carepilot.service.call;

import com.carepilot.dto.call.*;

import java.time.LocalDateTime;
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

    /** 스케줄 실행 시 "발신" 로직 (테스트 API·폴링 워커 공통). 지금은 로그, 추후 Twilio 등 연동 */
    void executeScheduledCall(String to, LocalDateTime scheduledTime, Long scheduleId);
}
