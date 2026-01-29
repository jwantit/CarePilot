package com.carepilot.service.auth;

import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;

/**
 * 인증 서비스
 * 로그아웃, 토큰 갱신, 토큰 생성/저장 처리
 */
public interface AuthService {
    
    ApprovalResponseDTO approveUser(String token);
    
    LogoutResponseDTO logout(String accessToken);
    
    LoginResponseDTO refreshToken(String refreshToken);
    
    /**
     * JWT 토큰 생성 (Access Token + Refresh Token)
     * @param userDTO 사용자 DTO
     * @return 토큰 정보 (accessToken, refreshToken, tokenType)
     */
    LoginResponseDTO generateTokens(com.carepilot.dto.auth.UserDTO userDTO);
    
    /**
     * Refresh Token을 Redis에 저장
     * @param userId 사용자 ID
     * @param refreshToken Refresh Token
     */
    void saveRefreshToken(Long userId, String refreshToken);
}

