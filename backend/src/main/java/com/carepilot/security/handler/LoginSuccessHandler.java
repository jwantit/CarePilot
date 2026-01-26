package com.carepilot.security.handler;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.security.util.CookieUtil;
import com.carepilot.service.auth.AuthService;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 로그인 성공 핸들러
 * Spring Security 폼 로그인 성공 시 JWT 토큰 발급 및 Redis 저장
 * 토큰은 httpOnly 쿠키로 설정하고, 사용자 정보는 JSON으로 응답
 */
@Log4j2
@Component
@RequiredArgsConstructor
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final Gson gson = new Gson();

    /**
     * 로그인 성공 시 호출되는 메서드
     * 1. 승인 안 된 일반 USER 차단 (NOT_APPROVED 예외 발생)
     * 2. 승인된 경우 JWT Access Token 및 Refresh Token 발급
     * 3. Refresh Token을 Redis에 저장 (24시간)
     * 4. 토큰을 httpOnly 쿠키로 설정
     * 5. 사용자 정보를 JSON으로 응답 (토큰은 쿠키로만 전달)
     * 
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param authentication 인증된 사용자 정보 (UserDTO 포함)
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        log.info("--------------LoginSuccessHandler-----------------");
        log.info(authentication);
        log.info("-------------------------------");

        UserDTO userDTO = (UserDTO) authentication.getPrincipal();

        // 승인 안 된 일반 USER 차단
        if (!"ACTIVE".equals(userDTO.getStatus()) && "USER".equals(userDTO.getRole())) {
            throw new AuthenticationServiceException("NOT_APPROVED");
        }

        // 승인된 경우만 JWT 발급
        // UserDTO에서 직접 토큰 생성 (불필요한 DB 조회 제거)
        LoginResponseDTO tokenResponse = authService.generateTokens(userDTO);
        authService.saveRefreshToken(userDTO.getUserId(), tokenResponse.getRefreshToken());

        log.info("로그인 성공: userId={}, email={}, role={}, refreshToken Redis 저장 완료", 
                userDTO.getUserId(), userDTO.getEmail(), userDTO.getRole());

        // 토큰을 httpOnly 쿠키로 설정
        cookieUtil.setAuthCookies(response, tokenResponse.getAccessToken(), tokenResponse.getRefreshToken());

        // 사용자 정보만 JSON으로 응답 (토큰은 쿠키로만 전달)
        Map<String, Object> userInfo = userDTO.getClaims();
        userInfo.put("tokenType", tokenResponse.getTokenType());

        String jsonStr = gson.toJson(userInfo);

        response.setContentType("application/json; charset=UTF-8");
        PrintWriter printWriter = response.getWriter();
        printWriter.println(jsonStr);
        printWriter.close();
    }
}

