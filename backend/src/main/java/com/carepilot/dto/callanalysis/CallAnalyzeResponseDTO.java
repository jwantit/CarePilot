package com.carepilot.dto.callanalysis;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * POST /api/calls/{callId}/analyze 응답용.
 * LLM 결과(요약, 비고, 시그널) + 임시로 riskScore 포함 (Postman 확인용).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CallAnalyzeResponseDTO {
    private final Long callId;
    private final String summary;
    private final String aiMemo;
    private final String signalsJson;  // 예: [{"signal":"FALL_RISK","severity":2}]
    private final Integer riskScore;   // 임시: Postman에서 확인용 (규칙 기반 산정값)
}
