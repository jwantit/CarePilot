package com.carepilot.dto.call;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakeCallResponseDTO {
    private String message;
    private String callSid; // Twilio Call SID (선택사항)
}

