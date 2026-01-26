package com.carepilot.security.filter;

import com.carepilot.security.util.JwtUtil;
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
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Log4j2
public class JwtCheckFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        log.debug("JwtCheckFilter 실행: method={}, path={}", request.getMethod(), request.getRequestURI());
        
        // 1. Authorization 헤더에서 토큰 추출
        String token = extractToken(request);
        
        // 2. 토큰이 있으면 검증 및 인증 정보 설정
        if (StringUtils.hasText(token)) {
            log.debug("JWT 토큰 발견: path={}", request.getRequestURI());
            if (jwtUtil.validateToken(token)) {
            try {
                // 3. 토큰에서 사용자 정보 추출
                Long userId = jwtUtil.getUserId(token);
                String role = jwtUtil.getRole(token);
                Long organizationId = jwtUtil.getOrganizationId(token);
                String status = jwtUtil.getStatus(token);
                
                log.debug("JWT 토큰 검증 성공: userId={}, role={}, organizationId={}", 
                        userId, role, organizationId);
                
                // 4. SecurityContext에 인증 정보 설정
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                                userId,  // principal (사용자 식별자)
                                null,    // credentials (비밀번호는 필요 없음)
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))  // 권한
                        );
                
                // 추가 정보를 details에 저장 (선택사항)
                authentication.setDetails(new JwtAuthenticationDetails(userId, role, organizationId, status));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
            } catch (Exception e) {
                log.warn("JWT 토큰 처리 중 오류 발생: {}", e.getMessage());
                // 인증 실패 시 SecurityContext를 비움
                SecurityContextHolder.clearContext();
            }
            } else {
                log.debug("JWT 토큰 검증 실패: path={}", request.getRequestURI());
            }
        } else {
            log.debug("JWT 토큰 없음: path={}", request.getRequestURI());
        }
        
        // 5. 다음 필터로 전달
        filterChain.doFilter(request, response);
    }
    
    /**
     * Authorization 헤더에서 Bearer 토큰 추출
     * @param request HTTP 요청
     * @return JWT 토큰 (없으면 null)
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        return null;
    }
    
    //JWT 인증 상세 정보를 저장하는 내부 클래스
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

