package com.carepilot.service.call;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.net.URI;

@Service
@Log4j2
public class TwilioService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.from-number}")
    private String fromNumber;

    @Value("${app.ngrok.base-url}")
    private String ngrokBaseUrl;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
        log.info("Twilio 초기화 완료: Account SID = {}", accountSid.substring(0, 10) + "...");
    }

    /**
     * Twilio를 통해 전화를 겁니다.
     * 
     * @param to 전화를 걸 번호 (예: +821012345678)
     * @param twimlUrl TwiML 음성 안내 URL (선택사항)
     * @return Twilio Call SID
     */
    public String makeCall(String to, String twimlUrl) {
        try {
            PhoneNumber from = new PhoneNumber(fromNumber);
            PhoneNumber toNumber = new PhoneNumber(to);

            Call call = Call.creator(toNumber, from, URI.create(twimlUrl != null ? twimlUrl : getDefaultTwiML()))
                    .setMethod(com.twilio.http.HttpMethod.GET)  //Twilio가 우리 서버에 접속할 때 GET 방식으로 들어오게 명시
                    .setRecord(true)  // 통화 녹음 활성화
                    .setRecordingStatusCallback(ngrokBaseUrl + "/api/twilio/recording/status")
                    .setRecordingStatusCallbackMethod(com.twilio.http.HttpMethod.POST)
                    .create();

            log.info("전화 발신 성공: from={}, to={}, callSid={}", fromNumber, to, call.getSid());
            return call.getSid();
        } catch (Exception e) {
            log.error("전화 발신 실패: to={}, error={}", to, e.getMessage(), e);
            throw new RuntimeException("전화 발신 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Twilio를 통해 SMS를 발송합니다. (테스트용)
     *
     * @param to 수신자 번호 (예: +821012345678)
     * @param body 발송할 메시지 내용
     * @return Twilio Message SID
     */
    public String sendSms(String to, String body) {
        try {
            PhoneNumber from = new PhoneNumber(fromNumber);
            PhoneNumber toNumber = new PhoneNumber(to);

            Message message = Message.creator(toNumber, from, body).create();

            log.info("SMS 발송 성공: from={}, to={}, messageSid={}", fromNumber, to, message.getSid());
            return message.getSid();
        } catch (Exception e) {
            log.error("SMS 발송 실패: to={}, error={}", to, e.getMessage(), e);
            throw new RuntimeException("SMS 발송 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 기본 TwiML 응답 (한국어 음성 안내)
     */
    private String getDefaultTwiML() {
        // ngrok을 통한 공개 URL 사용 (한국어 음성)
        return ngrokBaseUrl + "/api/twilio/twiml/voice";
    }
}

