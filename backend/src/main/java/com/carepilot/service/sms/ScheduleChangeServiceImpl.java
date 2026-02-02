package com.carepilot.service.sms;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.service.call.TwilioService;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@Log4j2
public class ScheduleChangeServiceImpl implements ScheduleChangeService {

    private static final String DATE_EXTRACT_PROMPT = """
            사용자가 보낸 문자에서 예약 변경을 요청한 날짜와 시각을 추출하세요.
            현재 시각: %s

            응답 형식(반드시 이 형식만 사용):
            YYYY-MM-DD HH:mm

            예: 2025-02-01 14:30

            파싱할 수 없으면 정확히: UNKNOWN
            다른 설명이나 글자는 절대 포함하지 마세요.
            """;

    private final CallScheduleRepository callScheduleRepository;
    private final ScheduleNotificationService scheduleNotificationService;
    private final TwilioService twilioService;

    private final ChatClient chatClient;

    public ScheduleChangeServiceImpl(
            CallScheduleRepository callScheduleRepository,
            ScheduleNotificationService scheduleNotificationService,
            TwilioService twilioService,
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.callScheduleRepository = callScheduleRepository;
        this.scheduleNotificationService = scheduleNotificationService;
        this.twilioService = twilioService;
        this.chatClient = chatClient;
    }

    @Override
    @Transactional
    public void processScheduleChange(InboundSms inboundSms) {
        if (inboundSms == null || inboundSms.getSmsType() != SmsType.SCHEDULE_CHANGE) {
            return;
        }
        CareTarget careTarget = inboundSms.getCareTarget();
        if (careTarget == null) {
            log.info("[ScheduleChange] CareTarget 없음 inboundSmsId={}", inboundSms.getInboundSmsId());
            return;
        }

        // 개인 스케줄만 대상 (그룹 스케줄 변경은 TODO 보류)
        // TODO: 개인이 그룹 스케줄 변경 요청 시 처리 방안
        List<CallSchedule> schedules = callScheduleRepository.findIndividualSchedulesByCareTargetAndStatus(
                careTarget, ScheduleStatus.SCHEDULED);
        if (schedules.isEmpty()) {
            log.info("[ScheduleChange] SCHEDULED 개인 예약 없음 careTargetId={}", careTarget.getCareTargetId());
            return;
        }

        // 가장 가까운 예약
        CallSchedule nearest = schedules.get(0);

        // 그룹 스케줄 체크 (혹시 모를 방어)
        if (nearest.getTargetType() == ScheduleTargetType.GROUP || nearest.getGroup() != null) {
            // TODO: 개인이 그룹 스케줄 변경 요청 시 처리 보류
            log.info("[ScheduleChange] 그룹 스케줄 변경 요청은 미지원(보류) scheduleId={}", nearest.getScheduleId());
            return;
        }

        // LLM으로 날짜 추출
        LocalDateTime newDateTime = extractDateTimeFromBody(inboundSms.getBody());
        if (newDateTime == null) {
            // TODO: 날짜 파싱 실패 시 처리 보류
            log.warn("[ScheduleChange] 날짜 파싱 실패 inboundSmsId={}, body={}", inboundSms.getInboundSmsId(), inboundSms.getBody());
            return;
        }

        // 예약 변경
        nearest.applyUpdates(careTarget, newDateTime, null, null, null, null, null);
        nearest.rescheduleNextRunAt(newDateTime);
        callScheduleRepository.save(nearest);

        // 변경 확인 문자 발송
        sendChangeConfirmationSms(careTarget, nearest);
        log.info("[ScheduleChange] 예약 변경 완료 scheduleId={}, newDateTime={}", nearest.getScheduleId(), newDateTime);
    }

    private LocalDateTime extractDateTimeFromBody(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        if (chatClient == null) {
            log.warn("[ScheduleChange] ChatClient 미설정, 날짜 추출 불가");
            return null;
        }
        try {
            String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String prompt = DATE_EXTRACT_PROMPT.formatted(nowStr);
            String response = chatClient.prompt()
                    .system(prompt)
                    .user("사용자 문자:\n" + body)
                    .call()
                    .content();

            if (response == null || response.trim().toUpperCase().contains("UNKNOWN")) {
                return null;
            }
            String trimmed = response.trim();
            // YYYY-MM-DD HH:mm 또는 YYYY-MM-DD HH:mm:ss 등
            if (trimmed.length() >= 16) {
                trimmed = trimmed.substring(0, 16);
            }
            return LocalDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        } catch (DateTimeParseException e) {
            log.warn("[ScheduleChange] 날짜 파싱 예외: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("[ScheduleChange] LLM 날짜 추출 실패: {}", e.getMessage(), e);
            return null;
        }
    }

    private void sendChangeConfirmationSms(CareTarget careTarget, CallSchedule schedule) {
        String phone = careTarget.getTargetPhone();
        if (phone == null || phone.isBlank()) {
            log.warn("[ScheduleChange] 전화번호 없음 careTargetId={}", careTarget.getCareTargetId());
            return;
        }
        LocalDateTime dt = schedule.getNextRunAt() != null ? schedule.getNextRunAt() : schedule.getScheduledTime();
        String timeText = dt != null
                ? String.format("%d월 %d일 %d시 %02d분", dt.getMonthValue(), dt.getDayOfMonth(), dt.getHour(), dt.getMinute())
                : "확인된 시각";
        String name = (careTarget.getName() != null && !careTarget.getName().isBlank())
                ? careTarget.getName() + "님"
                : "고객님";
        String message = "[CarePilot 안내]\n%s 전화 예약이 %s으로 변경되었습니다.".formatted(name, timeText);
        try {
            String parsed = parsePhoneNumber(phone);
            twilioService.sendSms(parsed, message);
        } catch (Exception e) {
            log.error("[ScheduleChange] 확인 문자 발송 실패: {}", e.getMessage(), e);
        }
    }

    private String parsePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }
        String cleaned = phoneNumber.replaceAll("[\\s-]", "");
        if (cleaned.startsWith("+82")) return cleaned;
        if (cleaned.startsWith("010")) return "+82" + cleaned.substring(1);
        if (cleaned.startsWith("0")) return "+82" + cleaned.substring(1);
        return "+82" + cleaned;
    }
}
