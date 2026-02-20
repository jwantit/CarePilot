package com.carepilot.dto.sms;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 수신/발신 통합 메시지 DTO. 목록에서 '나' / 'AI' / 수신 구분용.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsMessageDTO {

    /** INBOUND(수신) / OUTBOUND(발신) */
    private String direction;

    /** 발신인 경우만: USER(내가 보낸 문자) / AI(시스템이 보낸 문자). 수신이면 null */
    private String senderType;

    /** 목록 키용: in-{id} 또는 out-{id} */
    private String id;

    private String body;
    private String fromNumber;
    private String toNumber;
    private LocalDateTime createdAt;
    private List<String> mediaUrls;  // 수신 MMS만 해당

    /** 해당 번호의 케어대상 ID (상세 링크용). 없으면 null */
    private Long careTargetId;
    /** 해당 번호의 케어대상 이름 (OOO님 표기용). 없으면 null */
    private String careTargetName;
}
