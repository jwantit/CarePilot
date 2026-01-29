package com.carepilot.service.auth;

import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;

/**
 * 회원가입 서비스
 * 일반 회원가입 및 OAuth2 회원가입 처리
 */
public interface SignupService {
    
    /**
     * 업체 회원가입 (MANAGER)
     * @param request 회원가입 요청
     * @return 회원가입 응답 (organizationNumber)
     */
    OrganizationSignupResponseDTO signupOrganization(OrganizationSignupRequestDTO request);
    
    /**
     * 직원 회원가입 (USER)
     * @param request 회원가입 요청
     * @return 회원가입 응답
     */
    UserSignupResponseDTO signupUser(UserSignupRequestDTO request);
    
    /**
     * USER 소셜 회원가입 (OAuth2)
     * @param email 카카오 이메일
     * @param name 카카오 닉네임
     * @param password 비밀번호
     * @param organizationNumber 조직 번호
     * @return 로그인 응답 (승인 대기)
     */
    OAuth2LoginResponseDTO signupUserOAuth2(String email, String name, String password, String organizationNumber);
}

