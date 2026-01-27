package com.carepilot.dto.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.RiskScore;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class CallDetailResponseDTO {
    // 1. 기본 통화 정보
    private Long callId;
    private String startTime;
    private String endTime;
    private Integer duration;
    private String status;      // 통화 상태 (성공, 부재중 등)
    private String statusLabel; // 한국어 라벨 (성공, 실패 등)
    private String callType;    // 통화 유형 (정기 모니터링 등)

    // 2. 환자 정보 (CareTarget)
    private String patientName;
    private String patientPhone;

    // 3. 통화 내용 및 AI 분석 (Call + CallRecording)
    private String transcript;  // STT로 변환된 전체 대화 내용
    private String summary;     // AI 요약 (Call 엔티티의 summary)
    private String aiMemo;      // AI 메모 (Call 엔티티의 aiMemo)
    private String recordingFileName;
    private String recordingStoragePath;
    private String recordingContentType;
    private Long recordingFileSize;

    // 4. 위험도 정보 (RiskScore)
    private Integer riskScore;
    private String riskLevel;   // LOW, MEDIUM, HIGH

    public static CallDetailResponseDTO of(Call call, CallRecording recording, RiskScore riskScore) {
        String recordingFileName = null;
        String recordingStoragePath = null;
        String recordingContentType = null;
        Long recordingFileSize = null;

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        if (recording != null && recording.getFile() != null) {
            recordingFileName = recording.getFile().getOriginalName();
            recordingStoragePath = recording.getFile().getStoragePath();
            recordingContentType = recording.getFile().getContentType();
            recordingFileSize = recording.getFile().getFileSize();
        }

        return CallDetailResponseDTO.builder()
                .callId(call.getCallId())
                .startTime(call.getStartTime().format(formatter))
                .endTime(
                        call.getEndTime() != null ? call.getEndTime().format(formatter) : null)
                .duration(call.getDuration())
                .status(call.getStatus().name())
                .statusLabel(mapStatusLabel(call.getStatus()))
                .callType(call.getCallType() != null ? call.getCallType().name() : null)
                .patientName(call.getCareTarget().getName())
                .patientPhone(call.getCareTarget().getTargetPhone())
                .transcript(recording != null ? recording.getTranscript() : "녹취 데이터가 없습니다.")
                .summary(call.getSummary())
                .aiMemo(call.getAiMemo())
                .recordingFileName(recordingFileName)
                .recordingStoragePath(recordingStoragePath)
                .recordingContentType(recordingContentType)
                .recordingFileSize(recordingFileSize)
                .riskScore(riskScore != null ? riskScore.getRiskScore() : null)
                .riskLevel(riskScore != null ? riskScore.getRiskLevel().name() : "NONE")
                .build();
    }

    private static String mapStatusLabel(CallStatus status) {
        if (status == null) {
            return "-";
        }

        return switch (status) {
            case SUCCESS -> "성공";
            case FAILED -> "실패";
            case NO_ANSWER -> "무응답";
            case CANCELLED -> "취소됨";
        };
    }
}