package com.carepilot.dto.call;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MakeCallRequestDTO {
    private String to; // 전화를 걸 번호 (예: +821012345678)
    private String twimlUrl; // TwiML URL (선택사항)
    private String message; // 한국어 음성 메시지 (선택사항)
}

