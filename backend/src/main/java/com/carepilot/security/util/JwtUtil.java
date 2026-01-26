package com.carepilot.security.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    
    private final SecretKey secretKey;
    private final long accessTokenValidityInMilliseconds; // 60분
    private final long refreshTokenValidityInMilliseconds; // 24시간
    
    public JwtUtil(
            @Value("${jwt.secret:carepilot-secret-key-for-jwt-token-generation-minimum-256-bits}") String secret,
            @Value("${jwt.access-token-validity:3600000}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity:86400000}") long refreshTokenValidity) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidityInMilliseconds = accessTokenValidity;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidity;
    }
    
    /**
     * Access Token 생성 (60분 유효)
     * @param userId 사용자 ID
     * @param role 사용자 역할
     * @param organizationId 조직 ID
     * @param status 사용자 상태
     * @return Access Token
     */
    public String generateAccessToken(Long userId, String role, Long organizationId, String status) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenValidityInMilliseconds);
        
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("userId", userId)
                .claim("role", role)
                .claim("organizationId", organizationId)
                .claim("status", status)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }
    
    /**
     * Refresh Token 생성 (24시간 유효)
     * @param userId 사용자 ID
     * @return Refresh Token
     */
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenValidityInMilliseconds);
        
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }
    
    /**
     * 토큰에서 Claims 추출
     * @param token JWT 토큰
     * @return Claims
     */
    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * 토큰 검증
     * @param token JWT 토큰
     * @return 유효하면 true, 아니면 false
     */
    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 토큰에서 사용자 ID 추출
     * @param token JWT 토큰
     * @return 사용자 ID
     */
    public Long getUserId(String token) {
        Claims claims = extractClaims(token);
        return Long.parseLong(claims.getSubject());
    }
    
    /**
     * 토큰에서 역할 추출
     * @param token JWT 토큰
     * @return 역할
     */
    public String getRole(String token) {
        Claims claims = extractClaims(token);
        return claims.get("role", String.class);
    }
    
    /**
     * 토큰에서 조직 ID 추출
     * @param token JWT 토큰
     * @return 조직 ID
     */
    public Long getOrganizationId(String token) {
        Claims claims = extractClaims(token);
        return claims.get("organizationId", Long.class);
    }
    
    /**
     * 토큰에서 상태 추출
     * @param token JWT 토큰
     * @return 상태
     */
    public String getStatus(String token) {
        Claims claims = extractClaims(token);
        return claims.get("status", String.class);
    }
    
    /** TTL 조회
     * Refresh Token 유효 시간을 초 단위로 반환
     * @return Refresh Token 유효 시간 (초)
     */
    public long getRefreshTokenValidityInSeconds() {
        return refreshTokenValidityInMilliseconds / 1000;
    }
}

