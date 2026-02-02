package com.carepilot.service.sms;

import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.SmsType;

/**
 * 수신 문자 분류 서비스
 */
public interface SmsTypeService {

    /**
     * 수신 문자를 분류하여 SmsType 반환
     *
     * @param inboundSms 저장된 InboundSms (body, mediaPaths 포함)
     * @return SMS_AI_MEMO, SCHEDULE_CHANGE, PRESCRIPTION, UNKNOWN
     */
    SmsType classify(InboundSms inboundSms);
}
