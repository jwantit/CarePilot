package com.carepilot.dto.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class CallResponseDTO {
    private Long callId;
    private String startTime;   // "2024-01-15 10:30" 형식
    private String careTargetName;
    private String direction;   // 발신/수신
    private String callType;    // 정기 모니터링 등
    private String status;      // 성공, 부재중 등
    private String duration;    // "3분 0초" 형식
    private String resultStatus; // 테이블의 '상태' 컬럼

    public static CallResponseDTO from(Call call) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        // 초 단위를 "분 초"로 변환
        int totalSeconds = call.getDuration() != null ? call.getDuration() : 0;
        String durationStr = String.format("%d분 %d초", totalSeconds / 60, totalSeconds % 60);

        return CallResponseDTO.builder()
                .callId(call.getCallId())
                .startTime(call.getStartTime().format(formatter)) // 포맷 적용
                .careTargetName(call.getCareTarget().getName())
                .direction(call.getDirection() == CallDirection.INBOUND ? "수신" : "발신")
                .callType(call.getCallType() != null ? call.getCallType().name() : "-")
                .status(call.getStatus().name())
                .duration(durationStr) // "3분 0초"
                .resultStatus("성공")
                .build();
    }
}