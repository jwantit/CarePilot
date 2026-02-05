package com.carepilot.dto.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.notification.RiskLevel;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class CallResponseDTO {
    private Long callId;
    private String startTime;   // "yyyy-MM-dd HH:mm:ss"
    private String careTargetName;
    private String direction;   // 발신/수신
    private String callType;    // 정기 모니터링 등
    private String status;      // SUCCESS, FAILED 등
    private String statusLabel; // 한글 라벨
    private String duration;    // "3분 0초" 형식
    private String resultStatus; // 테이블의 '상태' 컬럼
    private Integer riskScore;   // 위험도 점수
    private String riskLevel;    // 위험도 레벨 (LOW, MEDIUM, HIGH, CRITICAL) - 계산된 값

    public static CallResponseDTO from(Call call) {
        return from(call, null, null);
    }

    public static CallResponseDTO from(Call call, RiskScore riskScore, RiskLevel calculatedRiskLevel) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        int totalSeconds = call.getDuration() != null ? call.getDuration() : 0;
        String durationStr = String.format("%d분 %d초", totalSeconds / 60, totalSeconds % 60);

        // startTime null 체크 추가
        String startTimeStr = call.getStartTime() != null 
                ? call.getStartTime().format(formatter) 
                : null;

        return CallResponseDTO.builder()
                .callId(call.getCallId())
                .startTime(startTimeStr)
                .careTargetName(call.getCareTarget().getName())
                .direction(call.getDirection() == CallDirection.INBOUND ? "수신" : "발신")
                .callType(call.getCallType() != null ? call.getCallType().name() : "-")
                .status(call.getStatus() != null ? call.getStatus().name() : "-")
                .statusLabel(mapStatusLabel(call.getStatus()))
                .duration(durationStr)
                .resultStatus("성공")
                .riskScore(riskScore != null ? riskScore.getRiskScore() : null)
                .riskLevel(calculatedRiskLevel != null ? calculatedRiskLevel.name() : null)
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