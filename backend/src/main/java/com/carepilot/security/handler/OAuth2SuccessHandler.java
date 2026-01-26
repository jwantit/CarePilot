package com.carepilot.security.handler;

import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.service.auth.OAuth2Service;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

//OAuth2 인증 성공 핸들러
//카카오 소셜 로그인 성공 시 처리
@Component
@RequiredArgsConstructor
@Log4j2
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuth2Service oAuth2Service;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        log.info("OAuth2 인증 성공: {}", authentication.getName());

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 카카오 사용자 정보 추출
        String email = extractEmail(attributes);
        String name = extractName(attributes);
        String providerId = oAuth2User.getName(); // 카카오 사용자 ID

        log.debug("카카오 사용자 정보: email={}, name={}, providerId={}", email, name, providerId);

        // OAuth2Service를 통해 로그인/회원가입 처리
        OAuth2LoginResponseDTO loginResponse = oAuth2Service.processKakaoLogin(email, name, providerId);
        
        // 로그인 성공 시 (기존 사용자 또는 ADMIN 회원가입 완료)
        if (loginResponse.isSuccess()) {
            // JWT 토큰을 쿼리 파라미터로 전달하여 프론트엔드로 리다이렉트
            String redirectUrl = String.format("%s/oauth2/callback?accessToken=%s&refreshToken=%s&role=%s&status=%s",
                    frontendUrl,
                    URLEncoder.encode(loginResponse.getAccessToken(), StandardCharsets.UTF_8),
                    URLEncoder.encode(loginResponse.getRefreshToken(), StandardCharsets.UTF_8),
                    URLEncoder.encode(loginResponse.getRole(), StandardCharsets.UTF_8),
                    URLEncoder.encode(loginResponse.getStatus(), StandardCharsets.UTF_8));
            
            log.info("OAuth2 로그인 성공, 프론트엔드로 리다이렉트");
            response.sendRedirect(redirectUrl);
            return;
        }
        
        // 추가 정보 입력 필요 (신규 USER 회원가입)
        if (loginResponse.isRequiresAdditionalInfo()) {
            // 이메일과 이름을 쿼리 파라미터로 전달하여 비밀번호 설정 & 업체번호 등록 페이지로 리다이렉트
            String redirectUrl = String.format("%s/oauth2/complete?email=%s&name=%s",
                    frontendUrl,
                    URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8),
                    URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8));
            
            log.info("OAuth2 신규 사용자, 비밀번호 설정 & 업체번호 등록 페이지로 리다이렉트: email={}, name={}", email, name);
            response.sendRedirect(redirectUrl);
            return;
        }
        
        // 승인 대기 중 (WAITING 상태)
        // 승인 대기 메시지와 함께 프론트엔드로 리다이렉트
        String redirectUrl = String.format("%s/oauth2/complete?email=%s&name=%s&status=WAITING&message=%s",
                frontendUrl,
                URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8),
                URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8),
                URLEncoder.encode(loginResponse.getMessage() != null ? loginResponse.getMessage() : "", StandardCharsets.UTF_8));
        
        log.info("OAuth2 승인 대기 중, 비밀번호 설정 & 업체번호 등록 페이지로 리다이렉트: email={}, status=WAITING", email);
        response.sendRedirect(redirectUrl);
    }

    //카카오 사용자 정보에서 이메일 추출
    private String extractEmail(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        if (kakaoAccount != null) {
            return (String) kakaoAccount.get("email");
        }
        return null;
    }

    //카카오 사용자 정보에서 이름 추출
    private String extractName(Map<String, Object> attributes) {
        Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
        if (properties != null) {
            return (String) properties.get("nickname");
        }
        return null;
    }
}


