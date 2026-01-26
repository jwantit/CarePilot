package com.carepilot.security.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * HTTP 쿠키 설정 유틸리티
 * httpOnly 쿠키를 생성, 읽기, 삭제하는 헬퍼 메서드 제공
 * SameSite 설정을 포함하여 CSRF 공격 방지
 */
@Log4j2
@Component
public class CookieUtil {

    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final int ACCESS_TOKEN_MAX_AGE = 3600; // 1시간 (초)
    private static final int REFRESH_TOKEN_MAX_AGE = 86400; // 24시간 (초)

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure; // HTTPS 환경에서는 true로 설정

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite; // Strict, Lax, None (기본값: Lax)

    // Access Token과 Refresh Token을 모두 httpOnly 쿠키로 설정
    // 로그인 성공 시와 Refresh Token 갱신 시 사용
    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // Access Token 쿠키 설정
        ResponseCookie accessTokenCookie = createCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_TOKEN_MAX_AGE);
        response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
        
        // Refresh Token 쿠키 설정
        ResponseCookie refreshTokenCookie = createCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_MAX_AGE);
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
        
        log.debug("인증 쿠키 설정 완료 (AccessToken + RefreshToken)");
    }


     //쿠키에서 Access Token 읽기
    public String getAccessTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, ACCESS_TOKEN_COOKIE_NAME);
    }

    // 쿠키에서 Refresh Token 읽기
    public String getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    }

    //쿠키에서 값 읽기 헬퍼 메서드
    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        
        return null;
    }

    //쿠키 생성 헬퍼 메서드
    //중복 로직 제거를 위한 private 메서드
    private ResponseCookie createCookie(String name, String value, int maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true) // JavaScript 접근 차단 (XSS 공격 방지)
                .secure(cookieSecure) // HTTPS 환경에서만 전송 (true일 경우)
                .path("/") // 모든 경로에서 접근 가능
                .maxAge(maxAge) // 쿠키 유효 시간 (초)
                .sameSite(cookieSameSite) // CSRF 공격 방지
                // SameSite 옵션:
                // - "Strict": 모든 cross-site 요청에서 쿠키 전송 차단 (가장 안전하지만 OAuth2 리다이렉트에서 문제 발생 가능)
                // - "Lax": GET 요청의 cross-site navigation에서만 쿠키 전송 (기본값, OAuth2와 호환)
                // - "None": 모든 cross-site 요청에서 쿠키 전송 (Secure=true 필수, 보안 위험)
                .build();
    }

    //모든 인증 쿠키 삭제 (AccessToken + RefreshToken)
    //로그아웃 시 사용
    public void deleteAuthCookies(HttpServletResponse response) {
        // Access Token 쿠키 삭제
        ResponseCookie accessTokenCookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0) // 즉시 만료
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
        
        // Refresh Token 쿠키 삭제
        ResponseCookie refreshTokenCookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0) // 즉시 만료
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
        
        log.debug("모든 인증 쿠키 삭제 완료");
    }
}

