package com.carepilot.security.util;

import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.InvalidClaimException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Component
public class JwtUtil {
    
    private final SecretKey secretKey;
    private final long accessTokenValidityInMilliseconds; // 60분
    private final long refreshTokenValidityInMilliseconds; // 24시간
    
    public JwtUtil(
            @Value("${jwt.secret:carepilot-secret-key-for-jwt-token-generation-minimum-256-bits}") String secret,
            @Value("${jwt.access-token-validity:3600000}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity:86400000}") long refreshTokenValidity) {
        try {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
        this.accessTokenValidityInMilliseconds = accessTokenValidity;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidity;
    }
    
    /**
     * Access Token 생성 (60분 유효)
     * @param userId 사용자 ID
     * @param email 이메일
     * @param name 이름
     * @param isSocial 소셜 로그인 여부
     * @param role 사용자 역할
     * @param organizationId 조직 ID
     * @param status 사용자 상태
     * @return Access Token
     */
    public String generateAccessToken(Long userId, String email, String name, Boolean isSocial, 
                                      String role, Long organizationId, String status) {
        
        int min = (int) (accessTokenValidityInMilliseconds / 60000);
        
        Map<String, Object> valueMap = Map.of(
            "userId", userId,
            "email", email != null ? email : "",
            "name", name != null ? name : "",
            "isSocial", isSocial != null ? isSocial : false,
            "role", role,
            "organizationId", organizationId != null ? organizationId : 0L,
            "status", status
        );
        
        String jwtStr = Jwts.builder()
                .setHeader(Map.of("typ", "JWT"))
                .setClaims(valueMap)
                .setIssuedAt(Date.from(ZonedDateTime.now().toInstant()))
                .setExpiration(Date.from(ZonedDateTime.now().plusMinutes(min).toInstant()))
                .signWith(secretKey)
                .compact();
        
        return jwtStr;
    }
    
    /**
     * Refresh Token 생성 (24시간 유효)
     * @param userId 사용자 ID
     * @return Refresh Token
     */
    public String generateRefreshToken(Long userId) {
        
        int min = (int) (refreshTokenValidityInMilliseconds / 60000);
        
        Map<String, Object> valueMap = Map.of("userId", userId);
        
        String jwtStr = Jwts.builder()
                .setHeader(Map.of("typ", "JWT"))
                .setClaims(valueMap)
                .setIssuedAt(Date.from(ZonedDateTime.now().toInstant()))
                .setExpiration(Date.from(ZonedDateTime.now().plusMinutes(min).toInstant()))
                .signWith(secretKey)
                .compact();
        
        return jwtStr;
    }
    
    /**
     * 토큰 검증 및 Claims 추출
     * token : Bearer 제거된 순수 JWT 문자열 HEADER.PAYLOAD.SIGNATURE
     * @param token JWT 토큰
     * @return JWT 안에 들어 있는 payload (Map<String, Object>)
     */
    public Map<String, Object> validateToken(String token) {
        
        Map<String, Object> claim = null;
        
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                    .parseClaimsJws(token) // 파싱 및 검증, 실패 시 에러
                .getBody();
            
            claim = claims;
        } catch (MalformedJwtException malformedJwtException) {
            log.error("Malformed JWT: {}", malformedJwtException.getMessage());
            throw new RuntimeException("MalFormed");
        } catch (ExpiredJwtException expiredJwtException) {
            log.error("Expired JWT: {}", expiredJwtException.getMessage());
            throw new RuntimeException("Expired");
        } catch (InvalidClaimException invalidClaimException) {
            log.error("Invalid JWT Claim: {}", invalidClaimException.getMessage());
            throw new RuntimeException("Invalid");
        } catch (JwtException jwtException) {
            log.error("JWT Error: {}", jwtException.getMessage());
            throw new RuntimeException("JWTError");
        } catch (Exception e) {
            log.error("JWT Parse Error: {}", e.getMessage());
            throw new RuntimeException("Error");
        }
        
        return claim;
        /*
         * {
         * "userId": 1,
         * "email": "test@test.com",
         * "name": "user1",
         * "isSocial": false,
         * "role": "USER",
         * "organizationId": 1,
         * "status": "ACTIVE",
         * "exp": 1712345678,
         * "iat": 1712340000
         * }
         */
    }
    
    /**
     * Refresh Token 유효 기간을 초 단위로 반환
     * @return Refresh Token 유효 기간 (초)
     */
    public long getRefreshTokenValidityInSeconds() {
        return refreshTokenValidityInMilliseconds / 1000;
    }
}

