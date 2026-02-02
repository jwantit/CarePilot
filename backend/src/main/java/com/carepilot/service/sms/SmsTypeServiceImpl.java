package com.carepilot.service.sms;

import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.SmsType;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class SmsTypeServiceImpl implements SmsTypeService {

    private static final String SYSTEM_PROMPT = """
            케어 대상자가 보낸 문자를 다음 중 하나로만 분류하세요.

            - SMS_AI_MEMO: 건강 상태, 증상, 불편함, 전달하고 싶은 내용, 요청 사항 등 (환자 요청/특이사항)
            - SCHEDULE_CHANGE: 전화 예약 일정 변경, 취소, 미루기, 다른 시간으로 변경 요청 등
            - UNKNOWN: 위에 해당하지 않음

            응답은 반드시 한 단어만: SMS_AI_MEMO, SCHEDULE_CHANGE, 또는 UNKNOWN
            다른 설명이나 글자는 절대 포함하지 마세요.
            """;

    private final ChatClient chatClient;

    public SmsTypeServiceImpl(
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @Override
    public SmsType classify(InboundSms inboundSms) {
        if (inboundSms == null) {
            return SmsType.UNKNOWN;
        }

        // 이미지 첨부 또는 URL -> PRESCRIPTION
        if (hasMedia(inboundSms)) {
            return SmsType.PRESCRIPTION;
        }

        String body = inboundSms.getBody();
        if (body == null || body.isBlank()) {
            return SmsType.UNKNOWN;
        }

        if (chatClient == null) {
            log.warn("ChatClient not configured. SMS classification skipped, returning UNKNOWN.");
            return SmsType.UNKNOWN;
        }

        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user("분류할 문자:\n" + body)
                    .call()
                    .content();

            return parseResponse(response);
        } catch (Exception e) {
            log.error("SMS 분류 실패 inboundSmsId={}: {}", inboundSms.getInboundSmsId(), e.getMessage(), e);
            return SmsType.UNKNOWN;
        }
    }

    private boolean hasMedia(InboundSms sms) {
        if (sms.getMediaPaths() != null && !sms.getMediaPaths().isBlank()) {
            return true;
        }
        String body = sms.getBody();
        if (body != null && body.matches("(?s).*https?://[^\\s]+\\.(jpg|jpeg|png|gif|webp)(\\?[^\\s]*)?.*")) {
            return true;
        }
        return false;
    }

    private SmsType parseResponse(String response) {
        if (response == null || response.isBlank()) {
            return SmsType.UNKNOWN;
        }
        String trimmed = response.trim().toUpperCase();
        if (trimmed.contains("SMS_AI_MEMO")) {
            return SmsType.SMS_AI_MEMO;
        }
        if (trimmed.contains("SCHEDULE_CHANGE")) {
            return SmsType.SCHEDULE_CHANGE;
        }
        if (trimmed.contains("UNKNOWN")) {
            return SmsType.UNKNOWN;
        }
        return SmsType.UNKNOWN;
    }
}
