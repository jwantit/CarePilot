package com.carepilot.common.exception;

import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Log4j2
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException e) {
        log.warn("ApiException 발생: code={}, message={}", e.getErrorCode().name(), e.getMessage());
        
        HttpStatus status = determineHttpStatus(e.getErrorCode());
        ErrorResponse response = ErrorResponse.of(e.getErrorCode(), e.getMessage());
        
        return ResponseEntity.status(status).body(response);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("IllegalArgumentException 발생: {}", e.getMessage());
        
        // 기존 IllegalArgumentException을 적절한 ErrorCode로 매핑
        ErrorCode errorCode = mapToErrorCode(e.getMessage());
        ErrorResponse response = ErrorResponse.of(errorCode, e.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException e) {
        log.error("RuntimeException 발생: {}", e.getMessage(), e);
        
        ErrorResponse response = ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            "서버 오류가 발생했습니다."
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("예상치 못한 예외 발생: {}", e.getMessage(), e);
        
        ErrorResponse response = ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            "서버 오류가 발생했습니다."
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    /**
     * ErrorCode에 따라 적절한 HTTP 상태 코드 반환
     */
    private HttpStatus determineHttpStatus(ErrorCode errorCode) {
        return switch (errorCode) {
            case AUTH_REQUIRED, INVALID_TOKEN, INVALID_REFRESH_TOKEN, REFRESH_TOKEN_MISMATCH -> HttpStatus.UNAUTHORIZED;
            case USER_NOT_APPROVED -> HttpStatus.FORBIDDEN;
            case EMAIL_ALREADY_EXISTS, USER_ALREADY_APPROVED, ORGANIZATION_NOT_FOUND -> HttpStatus.BAD_REQUEST;
            case USER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
    
    /**
     * 예외 메시지를 ErrorCode로 매핑 (하위 호환성)
     */
    private ErrorCode mapToErrorCode(String message) {
        if (message.contains("이미 존재하는 이메일") || message.contains("이미 등록된 이메일")) {
            return ErrorCode.EMAIL_ALREADY_EXISTS;
        }
        if (message.contains("존재하지 않는 업체 번호") || message.contains("존재하지 않는 조직 번호")) {
            return ErrorCode.ORGANIZATION_NOT_FOUND;
        }
        if (message.contains("유효하지 않거나 만료된 승인 토큰") || message.contains("유효하지 않은 Refresh Token")) {
            return ErrorCode.INVALID_TOKEN;
        }
        if (message.contains("이미 승인된 사용자")) {
            return ErrorCode.USER_ALREADY_APPROVED;
        }
        if (message.contains("승인되지 않은 사용자")) {
            return ErrorCode.USER_NOT_APPROVED;
        }
        if (message.contains("저장된 Refresh Token과 일치하지 않습니다")) {
            return ErrorCode.REFRESH_TOKEN_MISMATCH;
        }
        if (message.contains("organization_number 생성에 실패")) {
            return ErrorCode.ORGANIZATION_NUMBER_GENERATION_FAILED;
        }
        
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
}

