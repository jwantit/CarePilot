package com.carepilot.service.callanalysis.summary;

import com.carepilot.dto.callanalysis.CallSummaryResultDTO;

public interface CallSummaryService {

    // 통화 전문(transcript)을 LLM으로 요약합니다.
    // summary: 요약 내용, aiMemo: 특이사항 등 비고(없으면 null)
    CallSummaryResultDTO summarize(String transcript);
}
