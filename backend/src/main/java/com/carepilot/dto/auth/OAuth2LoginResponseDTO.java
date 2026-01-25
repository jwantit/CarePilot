package com.carepilot.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * OAuth2 로그인 응답 DTO
 */
@Getter
@AllArgsConstructor
public class OAuth2LoginResponseDTO {
    
    //로그인 성공 여부
    private boolean success;
    
    //JWT Access Token (로그인 성공 시)
    private String accessToken;
    
    //JWT Refresh Token (로그인 성공 시)
    private String refreshToken;
    
    //토큰 타입
    private String tokenType;
    
    //추가 정보 입력 필요 여부
    private boolean requiresAdditionalInfo;
    
    //추가 정보 입력 필요 시 메시지 (예: organization_number 입력 필요)
    private String message;
    
    //사용자 Role (로그인 성공 시)
    private String role;
    
    //사용자 상태 (로그인 성공 시)
    private String status;
    
    //로그인 성공 응답 생성
    public static OAuth2LoginResponseDTO success(String accessToken, String refreshToken, String role, String status) {
        return new OAuth2LoginResponseDTO(
            true,
            accessToken,
            refreshToken,
            "Bearer",
            false,
            null,
            role,
            status
        );
    }
    
    //추가 정보 입력 필요 응답 생성
    public static OAuth2LoginResponseDTO requiresAdditionalInfo(String message) {
        return new OAuth2LoginResponseDTO(
            false,
            null,
            null,
            null,
            true,
            message,
            null,
            null
        );
    }
    
    //승인 대기 중 응답 생성
    public static OAuth2LoginResponseDTO waitingApproval() {
        return new OAuth2LoginResponseDTO(
            false,
            null,
            null,
            null,
            false,
            "승인 대기 중입니다. 관리자 승인 후 로그인할 수 있습니다.",
            null,
            "WAITING"
        );
    }
}

