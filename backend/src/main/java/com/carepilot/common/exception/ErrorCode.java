package com.carepilot.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // 인증/인가 관련
    AUTH_REQUIRED("인증이 필요합니다."),
    INVALID_TOKEN("유효하지 않거나 만료된 토큰입니다."),
    INVALID_REFRESH_TOKEN("유효하지 않은 Refresh Token입니다."),
    REFRESH_TOKEN_MISMATCH("저장된 Refresh Token과 일치하지 않습니다."),
    USER_NOT_APPROVED("승인되지 않은 사용자입니다."),
    
    // 사용자 관련
    USER_NOT_FOUND("사용자를 찾을 수 없습니다."),
    EMAIL_ALREADY_EXISTS("이미 존재하는 이메일입니다."),
    USER_ALREADY_APPROVED("이미 승인된 사용자입니다."),
    
    // 조직 관련
    ORGANIZATION_NOT_FOUND("존재하지 않는 업체 번호입니다."),
    ORGANIZATION_NUMBER_GENERATION_FAILED("organization_number 생성에 실패했습니다. 다시 시도해주세요."),

    // 작업 관련
    TASK_NOT_FOUND("작업을 찾을 수 없습니다."),
    CARE_TARGET_NOT_FOUND("케어 대상을 찾을 수 없습니다."),

    // 기타
    BAD_REQUEST("잘못된 요청입니다."),
    CALL_RECORDING_NOT_FOUND("통화 녹취를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR("서버 오류가 발생했습니다.");

    private final String message;
}

