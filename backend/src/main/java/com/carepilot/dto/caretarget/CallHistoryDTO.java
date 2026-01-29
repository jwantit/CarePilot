package com.carepilot.dto.caretarget;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallHistoryDTO {
    private String callType;
    private String startTime;
    private String summary;
    private String status;
}
