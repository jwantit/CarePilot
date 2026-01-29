package com.carepilot.controller;

import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.MakeCallTestRequestDTO;
import com.carepilot.dto.callanalysis.CallAnalyzeResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.dto.call.ScheduleUpdateRequestDTO;
import com.carepilot.service.call.CallService;
import com.carepilot.service.callanalysis.CallAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Log4j2
public class CallController {

    private final CallService callService;
    private final CallAnalysisService callAnalysisService;

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

    // 테스트용: 해당 통화에 대해 LLM 요약·시그널 추출 후 DB 저장 및 위험도 계산. Postman에서 결과 확인용으로 응답 body 반환.
    @PostMapping("/{callId}/analyze")
    public ResponseEntity<CallAnalyzeResponseDTO> triggerAnalyze(@PathVariable Long callId) {
        Optional<CallAnalyzeResponseDTO> result = callAnalysisService.analyze(callId);
        return result
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // [테스트용] scheduledTime에 전화 발신 로그만 남기는 API
    @PostMapping("/make-call-test")
    public ResponseEntity<Void> makeCallTest(@RequestBody MakeCallTestRequestDTO request) {
        log.info("테스트 발신 - scheduledTime={}, to={}",
                request.getScheduledTime(),
                request.getTo());

        // 실제 전화 발신은 하지 않고, 로그만 남김
        return ResponseEntity.ok().build();
    }

}