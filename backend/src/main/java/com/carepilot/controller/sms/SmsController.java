package com.carepilot.controller.sms;

import com.carepilot.domain.sms.InboundSms;
import com.carepilot.dto.call.InboundSmsResponseDTO;
import com.carepilot.dto.call.SendSmsTestRequestDTO;
import com.carepilot.dto.call.SendSmsTestResponseDTO;
import com.carepilot.repository.sms.InboundSmsRepository;
import com.carepilot.service.call.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
@Log4j2
public class SmsController {

    private final InboundSmsRepository inboundSmsRepository;
    private final TwilioService twilioService;

    // [테스트용] 수신 SMS/MMS 목록 조회 - Postman 또는 브라우저에서 확인
    @GetMapping("/test/inbound-sms")
    public ResponseEntity<List<InboundSmsResponseDTO>> getInboundSmsList() {
        List<InboundSms> list = inboundSmsRepository.findAllByOrderByCreatedAtDesc();
        List<InboundSmsResponseDTO> result = list.stream()
                .map(sms -> {
                    List<String> mediaUrls = Collections.emptyList();
                    if (sms.getMediaPaths() != null && !sms.getMediaPaths().isEmpty()) {
                        mediaUrls = Stream.of(sms.getMediaPaths().split(","))
                                .map(p -> "/display/" + p.trim())
                                .collect(Collectors.toList());
                    }
                    return InboundSmsResponseDTO.builder()
                            .inboundSmsId(sms.getInboundSmsId())
                            .messageSid(sms.getMessageSid())
                            .fromNumber(sms.getFromNumber())
                            .toNumber(sms.getToNumber())
                            .body(sms.getBody())
                            .mediaUrls(mediaUrls)
                            .receivedAt(sms.getCreatedAt())
                            .careTargetId(sms.getCareTarget() != null ? sms.getCareTarget().getCareTargetId() : null)
                            .careTargetName(sms.getCareTarget() != null ? sms.getCareTarget().getName() : null)
                            .smsType(sms.getSmsType() != null ? sms.getSmsType().name() : null)
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // [테스트용] Postman으로 SMS 발송 테스트
    @PostMapping("/test/send-sms")
    public ResponseEntity<SendSmsTestResponseDTO> sendSmsTest(@RequestBody SendSmsTestRequestDTO request) {
        if (request.getTo() == null || request.getTo().trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("메시지 내용이 입력되지 않았습니다.");
        }
        String parsedPhoneNumber = parsePhoneNumber(request.getTo());
        String messageSid = twilioService.sendSms(parsedPhoneNumber, request.getMessage());
        return ResponseEntity.ok(SendSmsTestResponseDTO.builder()
                .message("문자 발송이 완료되었습니다.")
                .messageSid(messageSid)
                .build());
    }

    /**
     * 한국 전화번호를 Twilio 형식으로 파싱
     * 010-0000-0000 → +82100000000
     */
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
