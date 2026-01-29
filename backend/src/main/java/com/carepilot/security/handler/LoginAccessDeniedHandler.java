package com.carepilot.security.handler;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * 권한 부족(403)을 처리하는 핸들러
 * "로그인은 했지만, 권한이 없을 때(403)"를 처리하는 핸들러.
 * 인증 실패(401)랑은 완전히 다른 핸들러.
 */
@Component
@Log4j2
public class LoginAccessDeniedHandler implements AccessDeniedHandler {
    
    private final Gson gson = new Gson();
    
    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        log.warn("권한 부족: path={}, message={}", request.getRequestURI(), accessDeniedException.getMessage());
        
        String jsonStr = gson.toJson(Map.of("error", "ERROR_ACCESSDENIED"));
        
        response.setContentType("application/json");
        response.setStatus(HttpStatus.FORBIDDEN.value());
        
        PrintWriter printWriter = response.getWriter();
        printWriter.println(jsonStr);
        printWriter.close();
    }
}

