package com.carepilot.service.sms;

import com.carepilot.domain.call.CallSchedule;

/**
 * 스케줄 관련 알림 SMS 발송
 */
public interface ScheduleNotificationService {

    /**
     * 예약 확정 시 해당 대상자(들)에게 안내 문자 발송
     * 개인: 1명, 그룹: 그룹 내 모든 CareTarget
     *
     * @param schedule 저장 완료된 CallSchedule
     */
    void sendScheduleConfirmationSms(CallSchedule schedule);
}
