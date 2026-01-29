package com.carepilot.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private LocalDateTime timestamp;
    
    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(
            errorCode.name(),
            errorCode.getMessage(),
            LocalDateTime.now()
        );
    }
    
    public static ErrorResponse of(ErrorCode errorCode, String customMessage) {
        return new ErrorResponse(
            errorCode.name(),
            customMessage,
            LocalDateTime.now()
        );
    }
}

