package com.carepilot.service.sms;

import jakarta.servlet.http.HttpServletRequest;

public interface SmsService {
    void handleInboundSms(HttpServletRequest request, String messageSid, String from, String to, String body);
}
