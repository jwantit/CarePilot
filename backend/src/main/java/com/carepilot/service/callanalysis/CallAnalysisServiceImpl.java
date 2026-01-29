package com.carepilot.service.callanalysis;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.dto.callanalysis.CallAnalyzeResponseDTO;
import com.carepilot.dto.callanalysis.CallSummaryResultDTO;
import com.carepilot.dto.callanalysis.RiskAnalysisResultDTO;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.service.callanalysis.risk.CallRiskAnalysisService;
import com.carepilot.service.callanalysis.summary.CallSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Log4j2
public class CallAnalysisServiceImpl implements CallAnalysisService {

    private final CallRepository callRepository;
    private final CallRecordingRepository callRecordingRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final CallSummaryService callSummaryService;
    private final CallRiskAnalysisService callRiskAnalysisService;

    @Override
    @Transactional
    public Optional<CallAnalyzeResponseDTO> analyze(Long callId) {
        Call call = callRepository.findById(callId)
                .orElse(null);
        if (call == null) {
            log.warn("Call not found for analysis: callId={}", callId);
            return Optional.empty();
        }

        CallRecording recording = callRecordingRepository.findByCall_CallId(callId)
                .orElse(null);
        if (recording == null || recording.getTranscript() == null || recording.getTranscript().isBlank()) {
            log.debug("No transcript for callId={}, skip analysis", callId);
            return Optional.empty();
        }

        String transcript = recording.getTranscript();

        CallSummaryResultDTO summaryResult = callSummaryService.summarize(transcript);
        String signalsJson = summaryResult.getSignalsJson() != null ? summaryResult.getSignalsJson() : "[]";
        call.updateAiResult(
                summaryResult.getSummary(),
                summaryResult.getAiMemo(),
                signalsJson);
        callRepository.save(call);

        RiskAnalysisResultDTO riskResult = callRiskAnalysisService.analyze(signalsJson, transcript);

        RiskScore riskScore = RiskScore.builder()
                .organization(call.getOrganization())
                .careTarget(call.getCareTarget())
                .call(call)
                .riskScore(riskResult.getRiskScore())
                .riskLevel(null)
                .calculatedAt(LocalDateTime.now())
                .build();
        riskScoreRepository.save(riskScore);

        log.info("Analysis completed for callId={}, riskScore={}", callId, riskResult.getRiskScore());

        CallAnalyzeResponseDTO response = CallAnalyzeResponseDTO.builder()
                .callId(callId)
                .summary(summaryResult.getSummary())
                .aiMemo(summaryResult.getAiMemo())
                .signalsJson(signalsJson)
                .riskScore(riskResult.getRiskScore())  // 임시: Postman 확인용
                .build();
        return Optional.of(response);
    }
}
