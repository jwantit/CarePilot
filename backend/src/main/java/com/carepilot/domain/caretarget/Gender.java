package com.carepilot.domain.caretarget;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Gender {
    MALE("남성"),
    FEMALE("여성"),
    UNKNOWN("정보없음");

    private final String koName;

    // 문자열을 받아서 알맞은 Enum 객체를 찾아주는 유틸 메서드
    public static Gender find(String name) {
        if (name == null || name.trim().isEmpty()) return UNKNOWN;

        String trimmed = name.trim();
        if (trimmed.equals("남") || trimmed.equals("남성") || trimmed.equals("남자")) return MALE;
        if (trimmed.equals("여") || trimmed.equals("여성") || trimmed.equals("여자")) return FEMALE;

        return UNKNOWN;
    }
}
