package com.carepilot.security.filter;

import com.carepilot.security.util.JwtUtil;
//import com.carepilot.service.auth.TokenRedisService;
import com.google.gson.Gson;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Collections;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Log4j2
public class JwtCheckFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
//    private final TokenRedisService tokenRedisService;
    private final Gson gson = new Gson();
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // OPTIONS 요청(CORS preflight)은 필터링 제외
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        
        String path = request.getRequestURI();
        log.info("check uri......................." + path);
        
        // 인증이 필요 없는 경로는 필터링 제외
        // SecurityConfig에서 permitAll로 설정된 경로들
        if (path.startsWith("/auth/") && !path.equals("/auth/logout")) {
            return true;
        }
        
        // OAuth2 인증 엔드포인트
        if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) {
            return true;
        }
        
        // WebSocket 엔드포인트 (SockJS는 /ws/info 같은 HTTP 요청을 먼저 보냄)
        if (path.startsWith("/ws")) {
            return true;
        }
        
        return false;
    }
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        log.info("------------------------JwtCheckFilter------------------");
        
        String accessToken = null;
        
        // Authorization 헤더에서 JWT 추출
        String authHeaderStr = request.getHeader("Authorization");
        log.info("Authorization header: {}", authHeaderStr != null ? (authHeaderStr.length() > 20 ? authHeaderStr.substring(0, 20) + "..." : authHeaderStr) : "null");
        
        if (authHeaderStr != null && authHeaderStr.startsWith("Bearer ")) {
            accessToken = authHeaderStr.substring(7);
            log.info("JWT found in Authorization header, token length: {}", accessToken.length());
        }
        
        // JWT가 없으면 에러 응답
        if (accessToken == null) {
            log.error("JWT not found in Authorization header. Path: {}, Method: {}", request.getRequestURI(), request.getMethod());
            sendErrorResponse(response, "ERROR_ACCESS_TOKEN");
            return;
        }
        
        try {
            // 1. 블랙리스트 확인
//            if (tokenRedisService.isBlacklisted(accessToken)) {
//                log.warn("블랙리스트된 Access Token 발견: path={}", request.getRequestURI());
//                sendErrorResponse(response, "ERROR_ACCESS_TOKEN");
//                return;
//            }
            
            // 2. JWT 토큰 검증
            if (!jwtUtil.validateToken(accessToken)) {
                log.error("JWT validation failed");
                sendErrorResponse(response, "ERROR_ACCESS_TOKEN");
                return;
            }
            
            // 3. 토큰에서 사용자 정보 추출
            Long userId = jwtUtil.getUserId(accessToken);
            String role = jwtUtil.getRole(accessToken);
            Long organizationId = jwtUtil.getOrganizationId(accessToken);
            String status = jwtUtil.getStatus(accessToken);
            
            log.info("JWT claims: userId={}, role={}, organizationId={}, status={}", 
                    userId, role, organizationId, status);
            
            // 4. SecurityContext에 인증 정보 설정
            UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
            
            // 추가 정보를 details에 저장
            authentication.setDetails(new JwtAuthenticationDetails(userId, role, organizationId, status));
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            log.info("-----------------------------------");
            log.info("Authentication set for userId: {}", userId);
            
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            log.error("JWT Check Error..............");
            log.error(e.getMessage(), e);
            sendErrorResponse(response, "ERROR_ACCESS_TOKEN");
        }
    }
    
    /**
     * 에러 응답 전송
     */
    private void sendErrorResponse(HttpServletResponse response, String error) throws IOException {
        String msg = gson.toJson(Map.of("error", error));
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        PrintWriter printWriter = response.getWriter();
        printWriter.println(msg);
        printWriter.close();
    }
    
    // JWT 인증 상세 정보를 저장하는 내부 클래스
    public static class JwtAuthenticationDetails {
        private final Long userId;
        private final String role;
        private final Long organizationId;
        private final String status;
        
        public JwtAuthenticationDetails(Long userId, String role, Long organizationId, String status) {
            this.userId = userId;
            this.role = role;
            this.organizationId = organizationId;
            this.status = status;
        }
        
        public Long getUserId() {
            return userId;
        }
        
        public String getRole() {
            return role;
        }
        
        public Long getOrganizationId() {
            return organizationId;
        }
        
        public String getStatus() {
            return status;
        }
    }
}
