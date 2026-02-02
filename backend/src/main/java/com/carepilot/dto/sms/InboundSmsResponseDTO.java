package com.carepilot.dto.sms;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InboundSmsResponseDTO {

    private Long inboundSmsId;
    private String messageSid;
    private String fromNumber;
    private String toNumber;
    private String body;
    private List<String> mediaUrls;  // /display/MMS/xxx.jpg 형태로 변환된 URL
    private LocalDateTime receivedAt;
    private Long careTargetId;       // 매칭된 CareTarget ID (nullable)
    private String careTargetName;   // 매칭된 CareTarget 이름 (nullable)
    private String smsType;          // SMS_AI_MEMO, SCHEDULE_CHANGE, PRESCRIPTION, UNKNOWN
}
