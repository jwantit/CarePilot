package com.carepilot.dto.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.RiskScore;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CallDetailResponseDTO {
    // 1. 기본 통화 정보
    private Long callId;
    private String startTime;
    private String endTime;
    private Integer duration;
    private String status;      // 통화 상태 (성공, 부재중 등)
    private String callType;    // 통화 유형 (정기 모니터링 등)

    // 2. 환자 정보 (CareTarget)
    private String patientName;
    private String patientPhone;

    // 3. 통화 내용 및 AI 분석 (Call + CallRecording)
    private String transcript;  // STT로 변환된 전체 대화 내용
    private String summary;     // AI 요약 (Call 엔티티의 summary)
    private String aiMemo;      // AI 메모 (Call 엔티티의 aiMemo)

    // 4. 위험도 정보 (RiskScore)
    private Integer riskScore;
    private String riskLevel;   // LOW, MEDIUM, HIGH

    public static CallDetailResponseDTO of(Call call, CallRecording recording, RiskScore riskScore) {
        return CallDetailResponseDTO.builder()
                .callId(call.getCallId())
                .startTime(call.getStartTime().toString())
                .endTime(call.getEndTime() != null ? call.getEndTime().toString() : null)
                .duration(call.getDuration())
                .status(call.getStatus().name())
                .callType(call.getCallType() != null ? call.getCallType().name() : null)
                .patientName(call.getCareTarget().getName())
                .patientPhone(call.getCareTarget().getTargetPhone())
                .transcript(recording != null ? recording.getTranscript() : "녹취 데이터가 없습니다.")
                .summary(call.getSummary())
                .aiMemo(call.getAiMemo())
                .riskScore(riskScore != null ? riskScore.getRiskScore() : null)
                .riskLevel(riskScore != null ? riskScore.getRiskLevel().name() : "NONE")
                .build();
    }
}