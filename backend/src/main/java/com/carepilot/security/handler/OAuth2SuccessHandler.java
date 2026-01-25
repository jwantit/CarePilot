package com.carepilot.security.handler;

import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.service.auth.OAuth2Service;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

//OAuth2 인증 성공 핸들러
//카카오 소셜 로그인 성공 시 처리
@Component
@RequiredArgsConstructor
@Log4j2
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuth2Service oAuth2Service;
    private final Gson gson = new Gson();

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
        
        // 응답을 JSON으로 반환
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        PrintWriter writer = response.getWriter();
        String jsonResponse = gson.toJson(loginResponse);
        writer.println(jsonResponse);
        writer.close();
        
        log.info("OAuth2 로그인 처리 완료: success={}, requiresAdditionalInfo={}", 
                loginResponse.isSuccess(), loginResponse.isRequiresAdditionalInfo());
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


