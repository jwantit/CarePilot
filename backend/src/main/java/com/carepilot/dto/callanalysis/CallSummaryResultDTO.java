package com.carepilot.dto.callanalysis;

import lombok.Builder;
import lombok.Getter;

// AI 통화 요약 결과.
// summary: AI가 요약한 통화 내용
// aiMemo: 특이사항 등 따로 체크해야 할 내용(비고, 없으면 null)
// signalsJson: 검출된 시그널 JSON 배열. 예: [{"signal":"FALL_RISK","severity":2}] (없으면 "[]")
@Getter
@Builder
public class CallSummaryResultDTO {
    private final String summary;
    private final String aiMemo; // null 가능
    private final String signalsJson; // 없으면 "[]"
}
