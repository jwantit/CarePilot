package com.carepilot.controller.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.CallType;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.dto.call.*;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.ScenarioQuestionRepository;
import com.carepilot.service.call.CallService;
import com.carepilot.service.call.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Log4j2
public class CallController {

    private final CallService callService;
    private final TwilioService twilioService;
    private final CallRepository callRepository;
    private final CareTargetRepository careTargetRepository;
    private final CallScheduleRepository callScheduleRepository;
    private final ScenarioQuestionRepository scenarioQuestionRepository;

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

    // 테스트용: 전화번호로 조회 결과 확인
    @GetMapping("/test/phone/{phoneNumber}")
    public ResponseEntity<Map<String, Object>> testPhoneNumber(@PathVariable String phoneNumber) {
        Map<String, Object> result = new HashMap<>();
        
        log.info("=== 전화번호 테스트 시작 ===");
        log.info("입력 전화번호: {}", phoneNumber);
        
        // 전화번호 정규화
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        result.put("inputPhone", phoneNumber);
        result.put("normalizedPhone", normalizedPhone);
        log.info("정규화된 전화번호: {}", normalizedPhone);
        
        // CareTarget 찾기
        CareTarget careTarget = findCareTargetByPhone(normalizedPhone);
        if (careTarget == null) {
            result.put("careTarget", null);
            result.put("error", "CareTarget을 찾을 수 없습니다");
            result.put("callSchedule", null);
            result.put("scenario", null);
            result.put("questions", Collections.emptyList());
            log.warn("CareTarget을 찾을 수 없음: {}", normalizedPhone);
            return ResponseEntity.ok(result);
        }
        
        Map<String, Object> careTargetInfo = new HashMap<>();
        careTargetInfo.put("careTargetId", careTarget.getCareTargetId());
        careTargetInfo.put("name", careTarget.getName());
        careTargetInfo.put("phone", careTarget.getTargetPhone());
        result.put("careTarget", careTargetInfo);
        log.info("CareTarget 조회 성공: careTargetId={}, name={}", 
                careTarget.getCareTargetId(), careTarget.getName());
        
        // CallSchedule 찾기
        CallSchedule callSchedule = findCallScheduleByCareTarget(careTarget);
        if (callSchedule == null) {
            result.put("callSchedule", null);
            result.put("scenario", null);
            result.put("questions", Collections.emptyList());
            log.info("CallSchedule을 찾을 수 없음 (예약이 없음)");
            return ResponseEntity.ok(result);
        }
        
        Map<String, Object> scheduleInfo = new HashMap<>();
        scheduleInfo.put("scheduleId", callSchedule.getScheduleId());
        scheduleInfo.put("scheduledTime", callSchedule.getScheduledTime());
        scheduleInfo.put("status", callSchedule.getStatus());
        result.put("callSchedule", scheduleInfo);
        log.info("CallSchedule 조회 성공: scheduleId={}, scheduledTime={}", 
                callSchedule.getScheduleId(), callSchedule.getScheduledTime());
        
        // Scenario 찾기
        if (callSchedule.getScenario() == null) {
            result.put("scenario", null);
            result.put("questions", Collections.emptyList());
            log.warn("CallSchedule에 Scenario가 연결되지 않음: scheduleId={}", callSchedule.getScheduleId());
            return ResponseEntity.ok(result);
        }
        
        Scenario scenario = callSchedule.getScenario();
        Map<String, Object> scenarioInfo = new HashMap<>();
        scenarioInfo.put("scenarioId", scenario.getScenarioId());
        scenarioInfo.put("name", scenario.getName());
        scenarioInfo.put("category", scenario.getCategory());
        scenarioInfo.put("description", scenario.getDescription());
        result.put("scenario", scenarioInfo);
        log.info("Scenario 조회 성공: scenarioId={}, name={}", 
                scenario.getScenarioId(), scenario.getName());
        
        // 질문 리스트 조회
        List<ScenarioQuestion> questions = scenarioQuestionRepository
                .findByScenarioOrderByQuestionOrderAsc(scenario);
        
        List<Map<String, Object>> questionList = questions.stream()
                .map(q -> {
                    Map<String, Object> qInfo = new HashMap<>();
                    qInfo.put("questionId", q.getQuestionId());
                    qInfo.put("questionOrder", q.getQuestionOrder());
                    qInfo.put("questionText", q.getQuestionText());
                    qInfo.put("isRequired", q.getIsRequired());
                    return qInfo;
                })
                .collect(Collectors.toList());
        
        result.put("questions", questionList);
        result.put("questionCount", questions.size());
        
        log.info("=== 시나리오 질문 리스트 ===");
        log.info("질문 개수: {}", questions.size());
        for (int i = 0; i < questions.size(); i++) {
            ScenarioQuestion q = questions.get(i);
            log.info("질문 {}: order={}, text={}, required={}", 
                    i + 1, q.getQuestionOrder(), q.getQuestionText(), q.getIsRequired());
        }
        
        return ResponseEntity.ok(result);
    }

    // Twilio를 통한 전화 발신
    @PostMapping("/make-call")
    @Transactional
    public ResponseEntity<MakeCallResponseDTO> makeCall(@RequestBody MakeCallRequestDTO request) {
        // 010-0000-0000 형식을 +8210... 형식으로 파싱
        String parsedPhoneNumber = parsePhoneNumber(request.getTo());
        
        // 전화번호 정규화 (010-0000-0000 -> 01000000000)
        String normalizedPhone = normalizePhoneNumber(request.getTo());
        
        // 전화번호로 CareTarget 찾기
        CareTarget careTarget = findCareTargetByPhone(normalizedPhone);
        if (careTarget == null) {
            throw new IllegalArgumentException("해당 전화번호의 케어 대상자를 찾을 수 없습니다: " + request.getTo());
        }
        
        // CallSchedule 찾기 (예약된 통화가 있는 경우 - 선택사항)
        // 예약이 없어도 전화를 걸 수 있음
        CallSchedule callSchedule = findCallScheduleByCareTarget(careTarget);
        
        // 메시지가 있으면 쿼리 파라미터로 전달된 TwiML URL 사용
        String twimlUrl = request.getTwimlUrl();
        if (twimlUrl == null && request.getMessage() != null && !request.getMessage().isEmpty()) {
            String encodedMessage = URLEncoder.encode(request.getMessage(), StandardCharsets.UTF_8);
            twimlUrl = ngrokBaseUrl + "/api/twilio/twiml/voice?message=" + encodedMessage;
        }

        // Twilio로 전화 발신
        String callSid = twilioService.makeCall(parsedPhoneNumber, twimlUrl);
        
        // Call 엔티티 생성 및 저장
        Call call = Call.builder()
                .organization(careTarget.getOrganization())
                .careTarget(careTarget)
                .callSchedule(callSchedule)
                .direction(CallDirection.OUTBOUND)
                .callType(CallType.REGULAR_MONITORING)
                .status(CallStatus.NO_ANSWER) // 초기 상태는 무응답 (통화 완료 시 업데이트됨)
                .startTime(LocalDateTime.now())
                .callerId(normalizedPhone)
                .callSid(callSid)
                .build();
        
        callRepository.save(call);
        
        log.info("Call 엔티티 생성 완료: callId={}, callSid={}, careTargetId={}, scheduleId={}",
                call.getCallId(), callSid, careTarget.getCareTargetId(),
                callSchedule != null ? callSchedule.getScheduleId() : null);
        
        MakeCallResponseDTO response = MakeCallResponseDTO.builder()
                .message("전화 발신이 시작되었습니다.")
                .callSid(callSid)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 한국 전화번호를 Twilio 형식으로 파싱
     * 010-0000-0000 → +82100000000
     * 
     * @param phoneNumber 입력 전화번호 (010-0000-0000, 01000000000 등)
     * @return Twilio 형식 전화번호 (+82100000000)
     */
    private String parsePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }

        // 하이픈, 공백 제거
        String cleaned = phoneNumber.replaceAll("[\\s-]", "");
        
        // 이미 +82로 시작하면 그대로 반환
        if (cleaned.startsWith("+82")) {
            return cleaned;
        }
        
        // 010으로 시작하면 0을 제거하고 +82 추가
        if (cleaned.startsWith("010")) {
            return "+82" + cleaned.substring(1);
        }
        
        // 0으로 시작하면 0을 제거하고 +82 추가
        if (cleaned.startsWith("0")) {
            return "+82" + cleaned.substring(1);
        }
        
        // 그 외의 경우는 +82를 앞에 추가
        return "+82" + cleaned;
    }

    /**
     * 전화번호 정규화 (하이픈, 공백 제거)
     * 010-0000-0000 → 01000000000
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return "";
        }
        return phoneNumber.replaceAll("[\\s-]", "");
    }

    /**
     * 전화번호로 CareTarget 찾기
     */
    private CareTarget findCareTargetByPhone(String normalizedPhone) {
        return careTargetRepository.findAll().stream()
                .filter(t -> t.getTargetPhone() != null && 
                        t.getTargetPhone().replaceAll("[^0-9]", "").equals(normalizedPhone))
                .findFirst()
                .orElse(null);
    }

    /**
     * CareTarget으로 가장 가까운 CallSchedule 찾기 (선택사항)
     * 예약이 없어도 전화를 걸 수 있으므로 null을 반환할 수 있음
     */
    private CallSchedule findCallScheduleByCareTarget(CareTarget careTarget) {
        // 예약된 통화 일정 조회
        List<CallSchedule> schedules = callScheduleRepository
                .findByStatusInOrderByScheduledTimeAsc(List.of(ScheduleStatus.SCHEDULED));
        
        return schedules.stream()
                .filter(s -> s.getCareTarget() != null && 
                        s.getCareTarget().getCareTargetId().equals(careTarget.getCareTargetId()))
//                .filter(s -> {
//                    // 예약 시간이 현재 시간 기준 1시간 이내인 경우만
//                    LocalDateTime now = LocalDateTime.now();
//                    return s.getScheduledTime().isAfter(now.minusHours(1)) &&
//                           s.getScheduledTime().isBefore(now.plusHours(1));
//                })
                .findFirst()
                .orElse(null); // 예약이 없으면 null 반환 (정상 동작)
    }
}