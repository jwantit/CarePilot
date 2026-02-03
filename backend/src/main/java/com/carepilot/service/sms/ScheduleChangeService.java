package com.carepilot.service.sms;

import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.task.Task;

/**
 * SCHEDULE_CHANGE 타입 수신 문자 처리: 예약 일시 변경
 */
public interface ScheduleChangeService {

    /**
     * SCHEDULE_CHANGE 문자 처리 (AI 자동화)
     *
     * @param inboundSms 분류 완료된 InboundSms (smsType=SCHEDULE_CHANGE)
     */
    void processScheduleChange(InboundSms inboundSms);

    /**
     * 문자 자동화가 꺼져 있을 때 할일 목록에 수동 처리용 Task 추가
     *
     * @param inboundSms 분류 완료된 InboundSms (smsType=SCHEDULE_CHANGE)
     */
    void createManualScheduleChangeTask(InboundSms inboundSms);

    /**
     * 할일 목록에서 '시작' 클릭 시 기존 Task를 사용해 AI 자동 처리
     *
     * @param inboundSms 분류 완료된 InboundSms
     * @param existingTask 업데이트할 Task (inboundSms 연결됨)
     */
    void processScheduleChangeWithExistingTask(InboundSms inboundSms, Task existingTask);
}
