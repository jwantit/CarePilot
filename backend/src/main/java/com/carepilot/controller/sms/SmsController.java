package com.carepilot.controller.sms;

import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.OutboundSms;
import com.carepilot.domain.sms.SentBy;
import com.carepilot.dto.sms.InboundSmsResponseDTO;
import com.carepilot.dto.sms.SmsMessageDTO;
import com.carepilot.dto.sms.SendSmsTestRequestDTO;
import com.carepilot.dto.sms.SendSmsTestResponseDTO;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.sms.InboundSmsRepository;
import com.carepilot.repository.sms.OutboundSmsRepository;
import com.carepilot.service.call.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
@Log4j2
public class SmsController {

    private final InboundSmsRepository inboundSmsRepository;
    private final OutboundSmsRepository outboundSmsRepository;
    private final CareTargetRepository careTargetRepository;
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

    // [테스트용] Postman으로 SMS 발송 테스트 (발신 저장: USER)
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
        OutboundSms outbound = OutboundSms.builder()
                .messageSid(messageSid)
                .fromNumber(twilioService.getFromNumber())
                .toNumber(parsedPhoneNumber)
                .body(request.getMessage())
                .sentBy(SentBy.USER)
                .build();
        outboundSmsRepository.save(outbound);
        return ResponseEntity.ok(SendSmsTestResponseDTO.builder()
                .message("문자 발송이 완료되었습니다.")
                .messageSid(messageSid)
                .build());
    }

    /** 수신+발신 통합 목록 (나/AI/수신 구분용). 최신순 정렬. 전화번호 → 케어대상 이름/ID 매핑 포함 */
    @GetMapping("/test/messages")
    public ResponseEntity<List<SmsMessageDTO>> getMessages() {
        List<InboundSms> inList = inboundSmsRepository.findAllByOrderByCreatedAtDesc();
        List<OutboundSms> outList = outboundSmsRepository.findAllByOrderByCreatedAtDesc();

        Map<String, CareTarget> phoneToCareTarget = new HashMap<>();
        for (CareTarget ct : careTargetRepository.findAll()) {
            String key = normalizePhoneForLookup(ct.getTargetPhone());
            if (key != null && !key.isEmpty()) {
                phoneToCareTarget.putIfAbsent(key, ct);
            }
        }

        List<SmsMessageDTO> result = new ArrayList<>();
        for (InboundSms sms : inList) {
            List<String> mediaUrls = Collections.emptyList();
            if (sms.getMediaPaths() != null && !sms.getMediaPaths().isEmpty()) {
                mediaUrls = Stream.of(sms.getMediaPaths().split(","))
                        .map(p -> "/display/" + p.trim())
                        .collect(Collectors.toList());
            }
            CareTarget ct = sms.getCareTarget() != null ? sms.getCareTarget()
                    : phoneToCareTarget.get(normalizePhoneForLookup(sms.getFromNumber()));
            result.add(SmsMessageDTO.builder()
                    .direction("INBOUND")
                    .senderType(null)
                    .id("in-" + sms.getInboundSmsId())
                    .body(sms.getBody())
                    .fromNumber(sms.getFromNumber())
                    .toNumber(sms.getToNumber())
                    .createdAt(sms.getCreatedAt())
                    .mediaUrls(mediaUrls)
                    .careTargetId(ct != null ? ct.getCareTargetId() : null)
                    .careTargetName(ct != null ? ct.getName() : null)
                    .build());
        }
        for (OutboundSms sms : outList) {
            CareTarget ct = phoneToCareTarget.get(normalizePhoneForLookup(sms.getToNumber()));
            result.add(SmsMessageDTO.builder()
                    .direction("OUTBOUND")
                    .senderType(sms.getSentBy() != null ? sms.getSentBy().name() : null)
                    .id("out-" + sms.getOutboundSmsId())
                    .body(sms.getBody())
                    .fromNumber(sms.getFromNumber())
                    .toNumber(sms.getToNumber())
                    .createdAt(sms.getCreatedAt())
                    .mediaUrls(null)
                    .careTargetId(ct != null ? ct.getCareTargetId() : null)
                    .careTargetName(ct != null ? ct.getName() : null)
                    .build());
        }
        result.sort(Comparator.comparing(SmsMessageDTO::getCreatedAt).reversed());
        return ResponseEntity.ok(result);
    }

    /** 전화번호 비교용 정규화: 01012345678 형태로 통일 */
    private String normalizePhoneForLookup(String phone) {
        if (phone == null || phone.trim().isEmpty()) return "";
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("82") && digits.length() >= 10) {
            return "0" + digits.substring(2);
        }
        return digits;
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
