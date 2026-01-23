package com.carepilot.domain.enums;

public enum UserStatus {
    ACTIVE,      // 정상 사용 가능 (승인 완료)
    WAITING,     // 승인 대기 중
    DENIED,      // 승인 거부됨
    DISABLED     // 비활성화
}

