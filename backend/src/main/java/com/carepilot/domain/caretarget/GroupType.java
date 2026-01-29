package com.carepilot.domain.caretarget;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GroupType {
    DISEASE("질환별"),
    RISK("위험도별"),
    AGE("연령대별"),
    CUSTOM("사용자 정의");

    private final String kor; // 필드명도 짧게 kor로 변경

    // 한글 반환용 (도메인이나 DTO에서 사용)
    public String toKor() {
        return this.kor;
    }
}