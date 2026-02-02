package com.carepilot.dto.sms;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendSmsTestResponseDTO {

    private String message;
    private String messageSid;  // Twilio Message SID
}
