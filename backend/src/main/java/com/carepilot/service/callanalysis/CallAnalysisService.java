package com.carepilot.service.callanalysis;

import com.carepilot.dto.callanalysis.CallAnalyzeResponseDTO;

import java.util.Optional;

// 통화 전문에 대한 AI 요약 및 위험도 분석을 오케스트레이션합니다.
// 트리거(API/스케줄러)는 추후 연동 예정입니다.
public interface CallAnalysisService {

    /**
     * 해당 통화(callId)에 대해 요약 생성 후 Call 반영, 위험도 분석 후 RiskScore 저장을 수행합니다.
     * CallRecording이 없거나 transcript가 비어 있으면 빈 Optional 반환.
     *
     * @return 분석 결과(요약, 시그널, 위험도)를 담은 DTO, 실패 시 empty
     */
    Optional<CallAnalyzeResponseDTO> analyze(Long callId);
}
