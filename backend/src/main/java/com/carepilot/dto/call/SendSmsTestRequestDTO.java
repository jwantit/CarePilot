package com.carepilot.dto.call;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendSmsTestRequestDTO {

    /** 수신자 번호 (예: 010-1234-5678, +821012345678) */
    private String to;

    /** 발송할 메시지 내용 */
    private String message;
}
