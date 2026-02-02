package com.carepilot.service.sms;

import com.carepilot.domain.sms.InboundSms;

/**
 * SCHEDULE_CHANGE 타입 수신 문자 처리: 예약 일시 변경
 */
public interface ScheduleChangeService {

    /**
     * SCHEDULE_CHANGE 문자 처리
     * - 개인 스케줄만 처리 (그룹 스케줄 변경은 TODO 보류)
     * - 여러 예약 시 가장 가까운 예약 변경
     * - 날짜 파싱 실패 시 TODO 보류
     *
     * @param inboundSms 분류 완료된 InboundSms (smsType=SCHEDULE_CHANGE)
     */
    void processScheduleChange(InboundSms inboundSms);
}
