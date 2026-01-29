package com.carepilot.dto.call;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class MakeCallTestRequestDTO {

    // 전화를 걸 번호 (예: +821012345678)
    private String to;

    // 예약 시간
    private LocalDateTime scheduledTime;
}