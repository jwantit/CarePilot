package com.carepilot.dto.callanalysis;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleExtractionResultDTO {
    /** 스케줄 변경 요청 여부 */
    @JsonProperty("isScheduleChangeRequest")
    private Boolean isScheduleChangeRequest;
    
    /** 요청한 요일 (MONDAY, TUESDAY, ..., SUNDAY) */
    private String dayOfWeek;
    
    /** 요청한 시간 (HH:mm 형식, 예: 15:00) */
    private String targetTime;
    
    /** 추출된 원문 텍스트 */
    private String originalText;
    
    /** 분석 사유 또는 AI 메모 */
    private String reason;
}


