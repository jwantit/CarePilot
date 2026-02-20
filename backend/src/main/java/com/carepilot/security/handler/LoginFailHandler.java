package com.carepilot.security.handler;

import java.io.IOException;
import java.util.Map;

import com.carepilot.service.auth.TokenRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import com.google.gson.Gson;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;

/**
 * 로그인 실패 핸들러
 * Spring Security 폼 로그인 실패 시 에러 응답 처리
 * - BAD_CREDENTIALS: 잘못된 이메일/비밀번호 (401)
 * - NOT_APPROVED: 승인되지 않은 사용자 (403)
 * - LOCKED_ACCOUNT: 너무 많은 실패로 차단됨 (403)
 */
@Log4j2
@Component
@RequiredArgsConstructor
public class LoginFailHandler implements AuthenticationFailureHandler {

    private final TokenRedisService tokenRedisService;
    private final Gson gson = new Gson();

    /**
     * 로그인 실패 시 호출되는 메서드
     * 예외 메시지에 따라 에러 코드와 HTTP 상태 코드를 결정하여 JSON 응답
     * 
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param exception 인증 실패 예외 (메시지에 "NOT_APPROVED" 포함 가능)
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException {

        log.info("Login fail...." + exception);

        String email = request.getParameter("email");
        String errorCode = "BAD_CREDENTIALS";
        int status = HttpServletResponse.SC_UNAUTHORIZED;
        
        // 1. 차단된 계정인 경우
        if (exception instanceof LockedException || "TOO_MANY_ATTEMPTS".equals(exception.getMessage())) {
            errorCode = "LOCKED_ACCOUNT";
            status = HttpServletResponse.SC_FORBIDDEN;
        } 
        // 2. 승인 대기 중인 경우
        else if ("NOT_APPROVED".equals(exception.getMessage())) {
            errorCode = "NOT_APPROVED";
            status = HttpServletResponse.SC_FORBIDDEN;
        } 
        // 3. 비밀번호 불일치 등 일반적인 자격 증명 실패
        else {
            // 실패 카운트 증가 (이메일이 있는 경우에만)
            if (email != null && !email.isEmpty()) {
                int failCount = tokenRedisService.incrementLoginFailCount(email);
                log.info("로그인 실패 횟수: email={}, count={}", email, failCount);
                
                // 5회 이상 실패 시 바로 차단 코드 반환
                if (failCount >= 5) {
                    errorCode = "LOCKED_ACCOUNT";
                    status = HttpServletResponse.SC_FORBIDDEN;
                }
            }
        }

        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        
        Map<String, String> body = Map.of("error", errorCode);
        response.getWriter().write(gson.toJson(body));
    }
}

