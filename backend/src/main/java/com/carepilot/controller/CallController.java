package com.carepilot.controller;

import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.dto.call.ScheduleUpdateRequestDTO;
import com.carepilot.service.call.CallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallService callService;

    // [탭 1] 통화 이력 리스트 조회
    @GetMapping("/history")
    public ResponseEntity<List<CallResponseDTO>> getCallHistory() {
        return ResponseEntity.ok(callService.getCallHistory());
    }

    // [탭 1] 실시간 또는 상세 통화 내용 조회 (사진 2 상단 STT 뷰)
    @GetMapping("/{callId}")
    public ResponseEntity<CallDetailResponseDTO> getCallDetail(@PathVariable Long callId) {
        return ResponseEntity.ok(callService.getCallDetail(callId));
    }

    // [탭 2] 예약된 통화 일정 조회 (하단 리스트)
    @GetMapping("/schedules/upcoming")
    public ResponseEntity<List<ScheduleResponseDTO>> getUpcomingSchedules() {
        return ResponseEntity.ok(callService.getUpcomingSchedules());
    }

    // [탭 2] 캘린더용 월별 일정 조회
    @GetMapping("/schedules/calendar")
    public ResponseEntity<List<ScheduleResponseDTO>> getCalendarSchedules(
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(callService.getSchedulesByMonth(year, month));
    }

    // [탭 2] 일정 추가
    @PostMapping("/schedules")
    public ResponseEntity<Long> createSchedule(@RequestBody ScheduleCreateRequestDTO dto) {
        return ResponseEntity.ok(callService.createSchedule(dto));
    }

    // [탭 2] 일정 수정
    @PutMapping("/schedules/{scheduleId}")
    public ResponseEntity<Void> updateSchedule(
            @PathVariable Long scheduleId,
            @RequestBody ScheduleUpdateRequestDTO dto) {
        callService.updateSchedule(scheduleId, dto);
        return ResponseEntity.ok().build();
    }

    // [탭 2] 일정 삭제 (Soft delete)
    @DeleteMapping("/schedules/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
        callService.deleteSchedule(scheduleId);
        return ResponseEntity.ok().build();
    }

    // [탭 2] 일정 복구
    @PostMapping("/schedules/{scheduleId}/restore")
    public ResponseEntity<Void> restoreSchedule(@PathVariable Long scheduleId) {
        callService.restoreSchedule(scheduleId);
        return ResponseEntity.ok().build();
    }
}