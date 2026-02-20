package com.carepilot.service.auth;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Redis를 사용한 토큰 관리 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class TokenRedisServiceImpl implements TokenRedisService {
    
    private final StringRedisTemplate redisTemplate;
    
    // Redis 사용 가능 여부 플래그
    private final AtomicBoolean redisAvailable = new AtomicBoolean(false);
    
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final String BLACKLIST_PREFIX = "blacklist:access_token:";
    private static final String USER_REFRESH_TOKENS_PREFIX = "user:refresh_tokens:";
    private static final String LOGIN_FAIL_COUNT_PREFIX = "login_fail_count:";
    private static final String LOGIN_BLOCKED_PREFIX = "login_blocked:";
    
    // 설정값
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long FAIL_COUNT_TTL_SECONDS = 600; // 10분
    private static final long BLOCK_TTL_SECONDS = 1800; // 30분
    
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
    
    @Override
    public void saveRefreshToken(Long userId, String refreshToken, long ttlSeconds) {
        if (!redisAvailable.get()) {
            return;
        }
        
        try {
            String key = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.opsForValue().set(key, refreshToken, Duration.ofSeconds(ttlSeconds));
            
            String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
            redisTemplate.opsForSet().add(userTokensKey, refreshToken);
            redisTemplate.expire(userTokensKey, Duration.ofSeconds(ttlSeconds));
            
            log.debug("Refresh Token 저장: userId={}, ttl={}초", userId, ttlSeconds);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 저장 스킵: {}", e.getMessage());
            redisAvailable.set(false);
        }
    }
    
    @Override
    public String getRefreshToken(Long userId) {
        if (!redisAvailable.get()) {
            return null;
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
    
    @Override
    public boolean validateRefreshToken(Long userId, String refreshToken) {
        if (!redisAvailable.get()) {
            return false;
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
    
    @Override
    public void deleteRefreshToken(Long userId) {
        if (!redisAvailable.get()) {
            return;
        }
        
        try {
            String key = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.delete(key);
            
            String userTokensKey = USER_REFRESH_TOKENS_PREFIX + userId;
            redisTemplate.delete(userTokensKey);
            
            log.debug("Refresh Token 삭제: userId={}", userId);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 삭제 스킵: {}", e.getMessage());
            redisAvailable.set(false);
        }
    }
    
    @Override
    public void addToBlacklist(String accessToken, long ttlSeconds) {
        if (ttlSeconds <= 0) {
            log.debug("Access Token 블랙리스트 추가 스킵: ttl={}초 (이미 만료됨)", ttlSeconds);
            return;
        }
        
        if (!redisAvailable.get()) {
            return;
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
    
    @Override
    public boolean isBlacklisted(String accessToken) {
        if (!redisAvailable.get()) {
            return false;
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

    @Override
    public int incrementLoginFailCount(String email) {
        if (!redisAvailable.get()) return 0;

        try {
            String countKey = LOGIN_FAIL_COUNT_PREFIX + email;
            Long count = redisTemplate.opsForValue().increment(countKey);
            
            if (count != null && count == 1) {
                redisTemplate.expire(countKey, Duration.ofSeconds(FAIL_COUNT_TTL_SECONDS));
            }

            log.info("로그인 실패 카운트 증가: email={}, count={}", email, count);

            if (count != null && count >= MAX_LOGIN_ATTEMPTS) {
                String blockKey = LOGIN_BLOCKED_PREFIX + email;
                redisTemplate.opsForValue().set(blockKey, "blocked", Duration.ofSeconds(BLOCK_TTL_SECONDS));
                log.warn("로그인 시도 횟수 초과로 인한 계정 차단: email={}", email);
            }

            return count != null ? count.intValue() : 0;
        } catch (Exception e) {
            log.warn("Redis 연결 실패, 로그인 실패 카운트 증가 스킵: {}", e.getMessage());
            redisAvailable.set(false);
            return 0;
        }
    }

    @Override
    public boolean isLoginBlocked(String email) {
        if (!redisAvailable.get()) return false;

        try {
            String blockKey = LOGIN_BLOCKED_PREFIX + email;
            return Boolean.TRUE.equals(redisTemplate.hasKey(blockKey));
        } catch (Exception e) {
            log.warn("Redis 연결 실패, 로그인 차단 확인 스킵: {}", e.getMessage());
            redisAvailable.set(false);
            return false;
        }
    }

    @Override
    public void resetLoginHistory(String email) {
        if (!redisAvailable.get()) return;

        try {
            redisTemplate.delete(LOGIN_FAIL_COUNT_PREFIX + email);
            redisTemplate.delete(LOGIN_BLOCKED_PREFIX + email);
            log.debug("로그인 기록 초기화 완료: email={}", email);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, 로그인 기록 초기화 스킵: {}", e.getMessage());
            redisAvailable.set(false);
        }
    }
}
