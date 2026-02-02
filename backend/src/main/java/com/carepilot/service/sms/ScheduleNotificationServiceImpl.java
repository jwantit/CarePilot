package com.carepilot.service.sms;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.sms.OutboundSms;
import com.carepilot.domain.sms.SentBy;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.sms.OutboundSmsRepository;
import com.carepilot.service.call.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class ScheduleNotificationServiceImpl implements ScheduleNotificationService {

    private final TwilioService twilioService;
    private final CareTargetGroupMapRepository careTargetGroupMapRepository;
    private final OutboundSmsRepository outboundSmsRepository;

    @Override
    @Transactional(readOnly = true)
    public void sendScheduleConfirmationSms(CallSchedule schedule) {
        List<CareTarget> recipients = collectRecipients(schedule);
        if (recipients.isEmpty()) {
            log.warn("[ScheduleNotification] 수신자 없음 scheduleId={}", schedule.getScheduleId());
            return;
        }

        String timeText = buildTimeText(schedule);
        for (CareTarget careTarget : recipients) {
            String phone = careTarget.getTargetPhone();
            if (phone == null || phone.isBlank()) {
                log.warn("[ScheduleNotification] 전화번호 없음 careTargetId={}", careTarget.getCareTargetId());
                continue;
            }
            String name = (careTarget.getName() != null && !careTarget.getName().isBlank())
                    ? careTarget.getName() + "님"
                    : "고객님";
            String message = buildMessage(name, timeText);
            try {
                String parsedPhone = parsePhoneNumber(phone);
                String messageSid = twilioService.sendSms(parsedPhone, message);
                outboundSmsRepository.save(OutboundSms.builder()
                        .messageSid(messageSid)
                        .fromNumber(twilioService.getFromNumber())
                        .toNumber(parsedPhone)
                        .body(message)
                        .sentBy(SentBy.AI)
                        .build());
                log.info("[ScheduleNotification] 발송 완료 careTargetId={}, to={}", careTarget.getCareTargetId(), phone);
            } catch (Exception e) {
                log.error("[ScheduleNotification] 발송 실패 careTargetId={}, to={}, error={}",
                        careTarget.getCareTargetId(), phone, e.getMessage(), e);
            }
        }
    }

    private List<CareTarget> collectRecipients(CallSchedule schedule) {
        List<CareTarget> list = new ArrayList<>();
        if (schedule.getCareTarget() != null) {
            list.add(schedule.getCareTarget());
        } else if (schedule.getGroup() != null) {
            List<CareTargetGroupMap> maps = careTargetGroupMapRepository.findGroupDetails(
                    schedule.getOrganization().getOrganizationId(),
                    schedule.getGroup().getGroupId());
            for (CareTargetGroupMap map : maps) {
                if (map.getCareTarget() != null) {
                    list.add(map.getCareTarget());
                }
            }
        }
        return list;
    }

    private String buildTimeText(CallSchedule schedule) {
        LocalDateTime dt = schedule.getNextRunAt() != null ? schedule.getNextRunAt() : schedule.getScheduledTime();
        if (dt == null) return "확인된 시각";

        ScheduleType type = schedule.getType();
        ScheduleRecurrence recurrence = schedule.getRecurrence();

        if (type == ScheduleType.RECURRING && recurrence != null) {
            switch (recurrence) {
                case DAILY -> {
                    return String.format("매일 %d시 %02d분", dt.getHour(), dt.getMinute());
                }
                case WEEKLY -> {
                    String[] days = {"월", "화", "수", "목", "금", "토", "일"};
                    String day = days[dt.getDayOfWeek().getValue() - 1];
                    return String.format("매주 %s요일 %d시 %02d분", day, dt.getHour(), dt.getMinute());
                }
                case MONTHLY -> {
                    return String.format("매월 %d일 %d시 %02d분", dt.getDayOfMonth(), dt.getHour(), dt.getMinute());
                }
            }
        }
        return String.format("%d월 %d일 %d시 %02d분", dt.getMonthValue(), dt.getDayOfMonth(), dt.getHour(), dt.getMinute());
    }

    private String buildMessage(String name, String timeText) {
        return """
                [CarePilot 안내]
                %s 전화 예약이 %s으로 완료되었습니다.

                통화 전까지
                불편하신 증상이나 전달하고 싶은 내용이 있으면
                문자로 남겨주세요.

                최근 받은 처방전이나 관련 사진이 있다면
                이미지 링크로 보내주셔도 됩니다.
                """.formatted(name, timeText);
    }

    private String parsePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }
        String cleaned = phoneNumber.replaceAll("[\\s-]", "");
        if (cleaned.startsWith("+82")) {
            return cleaned;
        }
        if (cleaned.startsWith("010")) {
            return "+82" + cleaned.substring(1);
        }
        if (cleaned.startsWith("0")) {
            return "+82" + cleaned.substring(1);
        }
        return "+82" + cleaned;
    }
}
