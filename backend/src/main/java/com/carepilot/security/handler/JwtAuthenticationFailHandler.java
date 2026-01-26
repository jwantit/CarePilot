package com.carepilot.security.handler;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * 인증 실패(401)를 처리하는 핸들러
 * 로그인하지 않았거나, 토큰이 유효하지 않을 때 처리
 */
@Component
@Log4j2
public class JwtAuthenticationFailHandler implements AuthenticationEntryPoint {
    
    private final Gson gson = new Gson();
    
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        
        log.warn("인증 실패: path={}, message={}", request.getRequestURI(), authException.getMessage());
        
        String jsonStr = gson.toJson(Map.of("error", "ERROR_ACCESS_TOKEN"));
        
        response.setContentType("application/json");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        
        PrintWriter printWriter = response.getWriter();
        printWriter.println(jsonStr);
        printWriter.close();
    }
}

