package com.carepilot.service.callanalysis;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.notification.Notification;
import com.carepilot.dto.callanalysis.CallAnalyzeResponseDTO;
import com.carepilot.dto.callanalysis.CallSummaryResultDTO;
import com.carepilot.dto.callanalysis.RiskAnalysisResultDTO;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.dto.config.RiskConfigDTO;
import com.carepilot.service.callanalysis.risk.CallRiskAnalysisService;
import com.carepilot.service.callanalysis.schedule.AutoScheduleService;
import com.carepilot.service.callanalysis.summary.CallSummaryService;
import com.carepilot.service.config.risk.RiskConfigService;
import com.carepilot.service.notification.NotificationService;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
    private final AutoScheduleService autoScheduleService;
    private final RiskConfigService riskConfigService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

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

        CallSummaryResultDTO summaryResult;
        try {
            summaryResult = callSummaryService.summarize(transcript);
        } catch (Exception e) {
            log.error("통화 요약 분석 실패: callId={}, error={}", callId, e.getMessage(), e);
            // 요약 실패 시 빈 결과로 처리하여 나머지 분석은 계속 진행
            summaryResult = CallSummaryResultDTO.builder()
                    .summary("AI 분석을 수행할 수 없습니다.")
                    .aiMemo("AI 분석 중 오류가 발생했습니다.")
                    .signalsJson("[]")
                    .build();
        }
        
        String signalsJson = summaryResult.getSignalsJson() != null ? summaryResult.getSignalsJson() : "[]";
        call.updateAiResult(
                summaryResult.getSummary(),
                summaryResult.getAiMemo(),
                signalsJson);
        callRepository.save(call);

        RiskAnalysisResultDTO riskResult;
        try {
            riskResult = callRiskAnalysisService.analyze(signalsJson, transcript);
        } catch (Exception e) {
            log.error("위험도 분석 실패: callId={}, error={}", callId, e.getMessage(), e);
            // 위험도 분석 실패 시 기본값으로 처리
            riskResult = RiskAnalysisResultDTO.builder()
                    .riskScore(0)
                    .build();
        }

        // RiskConfigService를 사용하여 조직의 risk config를 가져오고 risk_level을 계산
        Long organizationId = call.getOrganization().getOrganizationId();
        RiskConfigDTO riskConfig = riskConfigService.getRiskConfig(organizationId);
        var riskLevel = riskConfigService.resolveLevel(riskResult.getRiskScore(), riskConfig);

        RiskScore riskScore = RiskScore.builder()
                .organization(call.getOrganization())
                .careTarget(call.getCareTarget())
                .call(call)
                .riskScore(riskResult.getRiskScore())
                .riskLevel(riskLevel)
                .calculatedAt(LocalDateTime.now())
                .build();
        riskScoreRepository.save(riskScore);

        log.info("Analysis completed for callId={}, riskScore={}", callId, riskResult.getRiskScore());

        // 위험 감지 알림 생성 (HIGH 또는 CRITICAL일 때만)
        if (riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.CRITICAL) {
            try {
                // 같은 Call에 대해 이미 위험 감지 알림이 생성되었는지 확인
                List<Notification> existingNotifications =
                        notificationRepository.findByCallIdAndType(call.getCallId(), NotificationType.RISK_DETECTION);

                if (existingNotifications.isEmpty()) {
                    notificationService.createRiskDetectionNotification(
                            call.getOrganization().getOrganizationId(),
                            call,
                            call.getCareTarget(),
                            riskResult.getRiskScore(),
                            riskLevel
                    );
                    log.info("위험 감지 알림 생성 완료: callId={}, riskScore={}, riskLevel={}",
                            callId, riskResult.getRiskScore(), riskLevel);
                } else {
                    log.info("이미 위험 감지 알림이 생성되어 중복 방지: callId={}", callId);
                }
            } catch (Exception e) {
                log.error("위험 감지 알림 생성 실패: callId={}, error={}", callId, e.getMessage(), e);
            }
        }

        // 사용자의 요청사항(요청사항: ...)이 있다면 스케줄 자동화 처리
        autoScheduleService.processAutoScheduleTask(callId, transcript);

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
