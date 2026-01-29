package com.carepilot.security.filter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.carepilot.dto.auth.UserDTO;
import com.carepilot.security.util.CookieUtil;
import com.carepilot.security.util.JwtUtil;
import com.carepilot.service.auth.TokenRedisService;
import com.google.gson.Gson;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Component
@RequiredArgsConstructor
public class JwtCheckFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final TokenRedisService tokenRedisService;
    private final CookieUtil cookieUtil;
    private final Gson gson = new Gson();
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {

        // Preflight 요청은 체크하지 않음
        // 브라우저 CORS 통과용
        if (request.getMethod().equals("OPTIONS")) {
            return true;
        }
        
        String path = request.getRequestURI();

        log.info("check uri......................." + path);
        if ("/login".equals(path)) {
            return true;
        }

        // 인증이 필요한 /auth 경로 (필터 적용)
        if (path.equals("/auth/logout") || path.equals("/auth/me")) {
            return false; // 필터 적용
        }

        // 공개 /auth 경로 (필터 스킵)
        // "JwtCheckFilter는 '로그인 이후 영역'만 담당한다"
        // "/auth/signup" 는 회원가입 경로이기 때문에 스킵
        // "/auth/approve" 는 승인 링크이기 때문에 스킵
        if (path.startsWith("/auth/")) {
            return true; // 필터 스킵
        }

        // OAuth2 인증 엔드포인트는 JWT 없이 허용
        if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) {
            return true;
        }
        
        // WebSocket 엔드포인트는 JWT 없이 허용 (SockJS는 /ws/info 같은 HTTP 요청을 먼저 보냄)
        if (path.startsWith("/ws")) {
            return true;
        }

        // 공개 조회용 엔드포인트 (필요시 추가)
        if (path.startsWith("/display/")) {
            return true;
        }

        // Twilio 웹훅 엔드포인트는 JWT 없이 허용
        if (path.startsWith("/api/twilio/") ||
            path.equals("/api/calls/make-call")) {
            return true;
        }

        return false;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        
        log.info("------------------------JwtCheckFilter------------------");
        
        String accessToken = null;
        
        // 1. Authorization 헤더에서 JWT 추출 (우선순위 1)
        String authHeaderStr = request.getHeader("Authorization");
        if (authHeaderStr != null && authHeaderStr.startsWith("Bearer ")) {
            accessToken = authHeaderStr.substring(7);
            log.debug("JWT found in Authorization header");
        }
        
        // 2. Authorization 헤더에 없으면 쿠키에서 JWT 추출 (우선순위 2)
        if (accessToken == null) {
            accessToken = cookieUtil.getAccessTokenFromCookie(request);
            if (accessToken != null) {
                log.debug("JWT found in cookie");
            }
        }

        // 3. JWT가 없으면 에러 응답 (토큰 관련 - 401)
        if (accessToken == null) {
            log.error("JWT not found in Authorization header or cookie. Path: {}, Method: {}", request.getRequestURI(), request.getMethod());
            sendErrorResponse(response, "ERROR_ACCESS_TOKEN", HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        
        try {
            // 1. 블랙리스트 확인 (로그아웃된 토큰 차단) - 토큰 관련
            // Redis 연결 실패 시 스킵하고 계속 진행 (서비스 가용성 우선)
            try {
                if (tokenRedisService.isBlacklisted(accessToken)) {
                    log.warn("블랙리스트된 Access Token 발견: path={}", request.getRequestURI());
                    sendErrorResponse(response, "ERROR_ACCESS_TOKEN", HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } catch (Exception e) {
                log.warn("Redis 연결 실패, 블랙리스트 확인 스킵: {}", e.getMessage());
                // Redis 오류는 시스템 오류이지만, 서비스 가용성을 위해 스킵하고 계속 진행
            }
            
            // 2. JWT 토큰 검증 및 Claims 추출 - 토큰 관련
            Map<String, Object> claims = null;
            try {
                claims = jwtUtil.validateToken(accessToken);
            } catch (Exception e) {
                // JWT 검증 실패는 토큰 관련 오류 (401)
                log.error("JWT validation failed: {}", e.getMessage());
                sendErrorResponse(response, "ERROR_ACCESS_TOKEN", HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            // 3. 토큰에서 사용자 정보 추출 - 토큰 관련
            Long userId;
            if (claims.get("userId") != null) {
                userId = ((Number) claims.get("userId")).longValue();
            } else {
                // JWT 구조 문제는 토큰 관련 오류 (401)
                log.error("JWT에 userId claim이 없음");
                sendErrorResponse(response, "ERROR_ACCESS_TOKEN", HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            String email = (String) claims.get("email");
            String name = (String) claims.get("name");
            Boolean isSocial = (Boolean) claims.get("isSocial");
            String role = (String) claims.get("role");
            Long organizationId = claims.get("organizationId") != null ?
                    ((Number) claims.get("organizationId")).longValue() : null;
            String status = (String) claims.get("status");

            log.info("JWT claims: userId={}, email={}, name={}, isSocial={}, role={}, organizationId={}, status={}",
                    userId, email, name, isSocial, role, organizationId, status);
            
            // 4. SecurityContext에 인증 정보 설정
            // UserDTO는 UserDetails 구현체
            // JWT에 들어 있던 사용자 정보를 Security가 이해할 수 있는 사용자 객체로 변환
            UserDTO userDTO = new UserDTO(userId, email, "", name, isSocial != null ? isSocial : false,
                                          role, organizationId, status);
            
            log.info("-----------------------------------");
            log.info(userDTO);
            log.info(userDTO.getAuthorities());

            // Authentication 객체를 만들고
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(userDTO, null, userDTO.getAuthorities());

            // SecurityContextHolder에 넣어서 "인증된 사용자"로 만들어줌
            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            // 토큰 관련이 아닌 시스템 오류는 500으로 처리
            // (UserDTO 생성 실패, SecurityContext 설정 실패, filterChain 실행 중 예외 등)
            log.error("System error in JWT Check Filter (non-token related): {}", e.getMessage(), e);
            sendErrorResponse(response, "INTERNAL_SERVER_ERROR", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * 에러 응답 전송
     * @param response HTTP 응답 객체
     * @param error 에러 코드
     * @param statusCode HTTP 상태 코드
     */
    private void sendErrorResponse(HttpServletResponse response, String error, int statusCode) throws IOException {
        String msg = gson.toJson(Map.of("error", error));
        response.setContentType("application/json");
        response.setStatus(statusCode);
        PrintWriter printWriter = response.getWriter();
        printWriter.println(msg);
        printWriter.close();
    }
}
