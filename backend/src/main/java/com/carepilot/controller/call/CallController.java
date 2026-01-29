package com.carepilot.controller.call;

import com.carepilot.dto.call.*;
import com.carepilot.service.call.CallService;
import com.carepilot.service.call.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Log4j2
public class CallController {

    private final CallService callService;
    private final TwilioService twilioService;

    @Value("${app.ngrok.base-url}")
    private String ngrokBaseUrl;

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

    // Twilio를 통한 전화 발신
    @PostMapping("/make-call")
    public ResponseEntity<MakeCallResponseDTO> makeCall(@RequestBody MakeCallRequestDTO request) {
        // 메시지가 있으면 쿼리 파라미터로 전달된 TwiML URL 사용
        String twimlUrl = request.getTwimlUrl();
        if (twimlUrl == null && request.getMessage() != null && !request.getMessage().isEmpty()) {
            String encodedMessage = URLEncoder.encode(request.getMessage(), StandardCharsets.UTF_8);
            twimlUrl = ngrokBaseUrl + "/api/twilio/twiml/voice?message=" + encodedMessage;
        }

        String callSid = twilioService.makeCall(request.getTo(), twimlUrl);
        MakeCallResponseDTO response = MakeCallResponseDTO.builder()
                .message("전화 발신이 시작되었습니다.")
                .callSid(callSid)
                .build();
        return ResponseEntity.ok(response);
    }
}