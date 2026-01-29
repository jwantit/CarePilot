package com.carepilot.controller.auth;

import com.carepilot.common.exception.ApiException;
import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;
import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.dto.auth.OAuth2SignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;
import com.carepilot.security.util.CookieUtil;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.auth.AuthService;
import com.carepilot.service.auth.SignupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Log4j2
public class AuthController {
    
    private final AuthService authService;
    private final SignupService signupService;
    private final UserUtil userUtil;
    private final CookieUtil cookieUtil;
    
    @PostMapping("/signup/organization")
    public ResponseEntity<OrganizationSignupResponseDTO> signupOrganization(
            @RequestBody OrganizationSignupRequestDTO request) {
        log.info("POST /auth/signup/organization 요청 수신");
        try {
            OrganizationSignupResponseDTO response = signupService.signupOrganization(request);
            log.info("POST /auth/signup/organization 성공: organizationNumber={}", response.getOrganizationNumber());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("POST /auth/signup/organization 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/signup/user")
    public ResponseEntity<UserSignupResponseDTO> signupUser(
            @RequestBody UserSignupRequestDTO request) {
        log.info("POST /auth/signup/user 요청 수신");
        try {
            UserSignupResponseDTO response = signupService.signupUser(request);
            log.info("POST /auth/signup/user 성공: email={}, status={}", request.getEmail(), response.getStatus());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("POST /auth/signup/user 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/approve")
    public ResponseEntity<ApprovalResponseDTO> approveUser(
            @RequestParam("token") String token) {
        // 토큰 마스킹 (보안: 앞 6자리만 표시)
        String maskedToken = token != null && token.length() > 6 
                ? token.substring(0, 6) + "***" 
                : "***";
        log.info("GET /auth/approve 요청 수신: token={}", maskedToken);
        try {
            ApprovalResponseDTO response = authService.approveUser(token);
            log.info("GET /auth/approve 성공: email={}, status={}", response.getEmail(), response.getStatus());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("GET /auth/approve 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build(); // 400 Bad Request
        } catch (Exception e) {
            log.error("GET /auth/approve 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500 Internal Server Error
        }
    }
    
    //현재 로그인한 사용자 정보 조회
    //쿠키 또는 Authorization 헤더에서 토큰을 읽어서 사용자 정보 반환
    //OAuth2 리다이렉트 후 프론트엔드에서 호출하여 사용자 정보 수신
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        log.info("GET /auth/me 요청 수신");
        try {
            // JwtCheckFilter를 거쳤으므로 SecurityContext에 UserDTO가 설정되어 있음
            UserDTO userDTO = userUtil.getCurrentUserDTO();
            
            Map<String, Object> userInfo = userDTO.getClaims();
            userInfo.put("tokenType", "Bearer");
            
            log.info("GET /auth/me 성공: userId={}, email={}", userDTO.getUserId(), userDTO.getEmail());
            return ResponseEntity.ok(userInfo);
        } catch (ApiException e) {
            log.warn("GET /auth/me 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("GET /auth/me 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDTO> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("POST /auth/logout 요청 수신");
        try {
            // Authorization 헤더 또는 쿠키에서 Access Token 추출
            String accessToken = extractToken(request);
            
            // 토큰이 있으면 로그아웃 처리
            if (accessToken != null) {
                authService.logout(accessToken);
            }
            
            // 모든 인증 쿠키 삭제
            cookieUtil.deleteAuthCookies(response);
            
            log.info("POST /auth/logout 성공");
            return ResponseEntity.ok(new LogoutResponseDTO("로그아웃되었습니다."));
        } catch (Exception e) {
            log.error("POST /auth/logout 실패: {}", e.getMessage(), e);
            // 실패해도 쿠키는 삭제
            cookieUtil.deleteAuthCookies(response);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Authorization 헤더 또는 쿠키에서 Bearer 토큰 추출
     * @param request HTTP 요청
     * @return JWT 토큰 (없으면 null)
     */
    private String extractToken(HttpServletRequest request) {
        // 1. Authorization 헤더에서 추출 (우선순위 1)
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // 2. 쿠키에서 추출 (우선순위 2)
        String cookieToken = cookieUtil.getAccessTokenFromCookie(request);
        if (cookieToken != null) {
            return cookieToken;
        }
        
        return null;
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            HttpServletRequest request, 
            HttpServletResponse response) {
        log.info("POST /auth/refresh 요청 수신");
        try {
            // 쿠키에서 Refresh Token 추출 (쿠키 기반 정책 고정)
            String refreshToken = cookieUtil.getRefreshTokenFromCookie(request);
            
            if (refreshToken == null) {
                log.warn("POST /auth/refresh 실패: Refresh Token이 없습니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // 토큰 갱신
            LoginResponseDTO tokenResponse = authService.refreshToken(refreshToken);
            
            // 새 토큰을 쿠키로 설정 (토큰은 쿠키로만 전달)
            cookieUtil.setAuthCookies(response, tokenResponse.getAccessToken(), tokenResponse.getRefreshToken());
            
            log.info("POST /auth/refresh 성공");
            // 토큰은 쿠키로만 전달하고, 응답은 success만 반환 (정책 일관성)
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            log.warn("POST /auth/refresh 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("POST /auth/refresh 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    //USER 소셜 회원가입 (organization_number 필요, status = WAITING)
    @PostMapping("/oauth2/signup/user")
    public ResponseEntity<OAuth2LoginResponseDTO> signupUserOAuth2(
            @RequestBody OAuth2SignupRequestDTO request) {
        log.info("POST /auth/oauth2/signup/user 요청 수신: email={}, name={}, organizationNumber={}", 
                request.getEmail(), request.getName(), request.getOrganizationNumber());
        try {
            OAuth2LoginResponseDTO response = signupService.signupUserOAuth2(
                    request.getEmail(), request.getName(), request.getPassword(), request.getOrganizationNumber());
            log.info("POST /auth/oauth2/signup/user 성공: email={}, status=WAITING", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("POST /auth/oauth2/signup/user 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("POST /auth/oauth2/signup/user 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


