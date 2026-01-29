package com.carepilot.service.auth;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

//Redis를 사용한 토큰 관리 서비스
// - Refresh Token 저장 및 검증
// - Access Token 블랙리스트 관리
@Service
@RequiredArgsConstructor
@Log4j2
public class TokenRedisService {
    
    private final StringRedisTemplate redisTemplate;
    
    // Redis 사용 가능 여부 플래그
    private final AtomicBoolean redisAvailable = new AtomicBoolean(false);
    
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final String BLACKLIST_PREFIX = "blacklist:access_token:";
    private static final String USER_REFRESH_TOKENS_PREFIX = "user:refresh_tokens:";
    
    /**
     * 애플리케이션 시작 시 Redis 연결 확인
     */
    @PostConstruct
    public void checkRedisConnection() {
        checkAndUpdateRedisStatus();
    }
    
    /**
     * Redis 연결 상태 확인 및 플래그 업데이트
     */
    private void checkAndUpdateRedisStatus() {
        try {
            redisTemplate.hasKey("health_check");
            redisAvailable.set(true);
            log.info("Redis 연결 성공");
        } catch (Exception e) {
            redisAvailable.set(false);
            log.warn("Redis 연결 실패, Redis 기능 비활성화: {}", e.getMessage());
        }
    }
    
    /**
     * Refresh Token 저장
     * @param userId 사용자 ID
     * @param refreshToken Refresh Token
     * @param ttlSeconds TTL (초 단위)
     */
    public void saveRefreshToken(Long userId, String refreshToken, long ttlSeconds) {
        if (!redisAvailable.get()) {
            return; // Redis 사용 불가능하면 바로 리턴
        }
        
        try {
            String key = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.opsForValue().set(key, refreshToken, Duration.ofSeconds(ttlSeconds));
            
            // 사용자별 Refresh Token 목록에 추가
            String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
            redisTemplate.opsForSet().add(userTokensKey, refreshToken);
            redisTemplate.expire(userTokensKey, Duration.ofSeconds(ttlSeconds));
            
            log.debug("Refresh Token 저장: userId={}, ttl={}초", userId, ttlSeconds);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 저장 스킵: {}", e.getMessage());
            redisAvailable.set(false); // 연결 실패 시 플래그 업데이트
        }
    }
    
    /**
     * Refresh Token 조회
     * @param userId 사용자 ID
     * @return Refresh Token (없으면 null)
     */
    public String getRefreshToken(Long userId) {
        if (!redisAvailable.get()) {
            return null; // Redis 사용 불가능하면 null 반환
        }
        
        try {
            String key = REFRESH_TOKEN_PREFIX + userId;
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 조회 스킵: {}", e.getMessage());
            redisAvailable.set(false);
            return null;
        }
    }
    
    /**
     * Refresh Token 검증
     * @param userId 사용자 ID
     * @param refreshToken 검증할 Refresh Token
     * @return 유효하면 true, 아니면 false (Redis 연결 실패 시 false 반환)
     */
    public boolean validateRefreshToken(Long userId, String refreshToken) {
        if (!redisAvailable.get()) {
            return false; // Redis 사용 불가능하면 검증 실패로 처리
        }
        
        try {
            String storedToken = getRefreshToken(userId);
            boolean isValid = storedToken != null && storedToken.equals(refreshToken);
            
            if (!isValid) {
                log.debug("Refresh Token 검증 실패: userId={}, storedToken 존재={}", 
                        userId, storedToken != null);
            } else {
                log.debug("Refresh Token 검증 성공: userId={}", userId);
            }
            
            return isValid;
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 검증 실패로 처리: {}", e.getMessage());
            redisAvailable.set(false);
            return false;
        }
    }
    
    /**
     * Refresh Token 삭제 (로그아웃 또는 갱신 시)
     * @param userId 사용자 ID
     */
    public void deleteRefreshToken(Long userId) {
        if (!redisAvailable.get()) {
            return; // Redis 사용 불가능하면 바로 리턴
        }
        
        try {
            String key = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.delete(key);
            
            // 사용자별 Refresh Token 목록도 삭제
            String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
            redisTemplate.delete(userTokensKey);
            
            log.debug("Refresh Token 삭제: userId={}", userId);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 삭제 스킵: {}", e.getMessage());
            redisAvailable.set(false);
        }
    }
    
    /**
     * Access Token 블랙리스트 추가 (로그아웃 시)
     * @param accessToken Access Token
     * @param ttlSeconds TTL (초 단위, Access Token의 남은 만료 시간)
     */
    public void addToBlacklist(String accessToken, long ttlSeconds) {
        if (ttlSeconds <= 0) {
            log.debug("Access Token 블랙리스트 추가 스킵: ttl={}초 (이미 만료됨)", ttlSeconds);
            return;
        }
        
        if (!redisAvailable.get()) {
            return; // Redis 사용 불가능하면 바로 리턴
        }
        
        try {
            String key = BLACKLIST_PREFIX + accessToken;
            redisTemplate.opsForValue().set(key, "expired", Duration.ofSeconds(ttlSeconds));
            log.debug("Access Token 블랙리스트 추가: ttl={}초", ttlSeconds);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Access Token 블랙리스트 추가 스킵: {}", e.getMessage());
            redisAvailable.set(false);
        }
    }
    
    /**
     * Access Token이 블랙리스트에 있는지 확인
     * @param accessToken Access Token
     * @return 블랙리스트에 있으면 true, 없으면 false (Redis 연결 실패 시 false 반환)
     */
    public boolean isBlacklisted(String accessToken) {
        if (!redisAvailable.get()) {
            return false; // Redis 사용 불가능하면 블랙리스트 없음으로 처리
        }
        
        try {
            String key = BLACKLIST_PREFIX + accessToken;
            boolean isBlacklisted = Boolean.TRUE.equals(redisTemplate.hasKey(key));
            
            if (isBlacklisted) {
                log.debug("블랙리스트된 Access Token 발견");
            }
            
            return isBlacklisted;
        } catch (Exception e) {
            log.warn("Redis 연결 실패, 블랙리스트 확인 스킵: {}", e.getMessage());
            redisAvailable.set(false);
            return false;
        }
    }
    
}

