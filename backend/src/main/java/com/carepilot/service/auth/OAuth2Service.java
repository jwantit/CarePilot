package com.carepilot.service.auth;

import com.carepilot.dto.auth.OAuth2LoginResponseDTO;

/**
 * OAuth2 소셜 로그인 서비스
 */
public interface OAuth2Service {
    
    /**
     * 카카오 소셜 로그인 처리
     * @param email 카카오 이메일
     * @param name 카카오 닉네임
     * @param providerId 카카오 사용자 ID
     * @return 로그인 응답 (JWT 토큰 또는 추가 정보 입력 필요)
     */
    OAuth2LoginResponseDTO processKakaoLogin(String email, String name, String providerId);
    
    /**
     * USER 소셜 회원가입 (organization_number 필요, status = WAITING)
     * @param email 카카오 이메일
     * @param name 카카오 닉네임
     * @param password 비밀번호
     * @param organizationNumber 조직 번호
     * @return 로그인 응답 (승인 대기)
     */
    OAuth2LoginResponseDTO signupUser(String email, String name, String password, String organizationNumber);
}

