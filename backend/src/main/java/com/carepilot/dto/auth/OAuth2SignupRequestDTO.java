package com.carepilot.dto.auth;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * OAuth2 소셜 회원가입 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class OAuth2SignupRequestDTO {
    
    //카카오 이메일
    private String email;
    
    //카카오 닉네임
    private String name;
    
    //조직 번호 (USER Role일 때 필수)
    private String organizationNumber;
}

