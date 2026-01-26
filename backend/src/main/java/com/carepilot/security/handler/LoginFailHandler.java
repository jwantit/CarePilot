package com.carepilot.security.handler;

import java.io.IOException;
import java.util.Map;

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
 */
@Log4j2
@Component
public class LoginFailHandler implements AuthenticationFailureHandler {

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

        String errorCode = "BAD_CREDENTIALS";
        int status = HttpServletResponse.SC_UNAUTHORIZED;
        
        if ("NOT_APPROVED".equals(exception.getMessage())) {
            errorCode = "NOT_APPROVED";
            status = HttpServletResponse.SC_FORBIDDEN;
        }

        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        
        Map<String, String> body = Map.of("error", errorCode);
        response.getWriter().write(gson.toJson(body));
    }
}

