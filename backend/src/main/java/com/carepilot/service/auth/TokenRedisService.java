package com.carepilot.service.auth;

/**
 * Redis를 사용한 토큰 관리 서비스 인터페이스
 */
public interface TokenRedisService {
    
    /**
     * Refresh Token 저장
     */
    void saveRefreshToken(Long userId, String refreshToken, long ttlSeconds);
    
    /**
     * Refresh Token 조회
     */
    String getRefreshToken(Long userId);
    
    /**
     * Refresh Token 검증
     */
    boolean validateRefreshToken(Long userId, String refreshToken);
    
    /**
     * Refresh Token 삭제
     */
    void deleteRefreshToken(Long userId);
    
    /**
     * Access Token 블랙리스트 추가
     */
    void addToBlacklist(String accessToken, long ttlSeconds);
    
    /**
     * Access Token 블랙리스트 여부 확인
     */
    boolean isBlacklisted(String accessToken);

    /**
     * 로그인 실패 횟수 증가 및 차단 여부 확인
     */
    int incrementLoginFailCount(String email);

    /**
     * 로그인 차단 여부 확인
     */
    boolean isLoginBlocked(String email);

    /**
     * 로그인 실패 기록 및 차단 기록 초기화
     */
    void resetLoginHistory(String email);
}
