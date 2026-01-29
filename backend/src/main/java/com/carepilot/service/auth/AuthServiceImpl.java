package com.carepilot.service.auth;

import java.util.Map;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.JwtUtil;
import com.carepilot.security.util.UserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 인증 서비스 구현
 * 로그아웃, 토큰 갱신, 토큰 생성/저장 처리
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final ApprovalService approvalService;
    private final JwtUtil jwtUtil;
    private final TokenRedisService tokenRedisService;
    private final UserUtil userUtil;
    
    @Override
    public ApprovalResponseDTO approveUser(String token) {
        log.info("승인 요청: token={}", token);
        
        // 1. 토큰 검증
        Long userId = approvalService.validateToken(token);
        if (userId == null) {
            log.warn("유효하지 않은 승인 토큰: token={}", token);
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
        
        log.debug("토큰 검증 성공: userId={}", userId);
        
        // 2. 승인 대상 USER 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("승인 대상 사용자를 찾을 수 없음: userId={}", userId);
                    return new ApiException(ErrorCode.USER_NOT_FOUND);
                });
        
        log.debug("승인 대상 사용자 조회: userId={}, email={}, status={}", 
                user.getUserId(), user.getEmail(), user.getStatus());
        
        // 3. 이미 승인된 경우 체크
        if (user.getStatus() == UserStatus.ACTIVE) {
            log.warn("이미 승인된 사용자: userId={}, email={}", user.getUserId(), user.getEmail());
            throw new ApiException(ErrorCode.USER_ALREADY_APPROVED);
        }
        
        // 4. status → ACTIVE
        user.setStatus(UserStatus.ACTIVE);
        
        // 5. approval_processed_at 기록
        user.setApprovalProcessedAt(LocalDateTime.now());
        
        // 6. approved_by 기록 (현재는 null, 추후 JWT에서 가져올 예정)
        user.setApprovedBy(null);
        
        // 변경사항 저장
        userRepository.save(user);
        log.debug("사용자 상태 변경 완료: status=ACTIVE, approval_processed_at={}", user.getApprovalProcessedAt());
        
        // 7. 토큰 삭제
        approvalService.removeToken(token);
        log.debug("승인 토큰 삭제 완료: token={}", token);
        
        // 8. ApprovalResponse 반환
        log.info("승인 처리 완료: userId={}, email={}", user.getUserId(), user.getEmail());
        return new ApprovalResponseDTO(
                "승인이 완료되었습니다. 이제 로그인할 수 있습니다.",
                "ACTIVE",
                user.getEmail()
        );
    }

    @Override
    public LogoutResponseDTO logout(String accessToken) {
        Long currentUserId = userUtil.getCurrentUserDTO().getUserId();
        log.info("로그아웃 요청: userId={}", currentUserId);
        
            // Refresh Token 삭제 (Redis 연결 실패 시에도 로그아웃은 성공)
            try {
                tokenRedisService.deleteRefreshToken(currentUserId);
                log.debug("Refresh Token 삭제 완료: userId={}", currentUserId);
            } catch (Exception e) {
                log.warn("Redis 연결 실패, Refresh Token 삭제 스킵: {}", e.getMessage());
        }
        
        // Access Token을 블랙리스트에 추가 (남은 만료 시간만큼)
        if (accessToken != null) {
            try {
                Map<String, Object> claims = jwtUtil.validateToken(accessToken);
                // JWT의 exp claim에서 만료 시간 추출
                Object expObj = claims.get("exp");
                if (expObj != null) {
                    long expirationTime = ((Number) expObj).longValue() * 1000; // 초를 밀리초로 변환
                long currentTime = System.currentTimeMillis();
                long ttlSeconds = (expirationTime - currentTime) / 1000;
                
                if (ttlSeconds > 0) {
                    tokenRedisService.addToBlacklist(accessToken, ttlSeconds);
                    log.debug("Access Token 블랙리스트 추가 완료: ttl={}초", ttlSeconds);
                } else {
                    log.debug("Access Token이 이미 만료되어 블랙리스트 추가 불필요");
                    }
                }
            } catch (Exception e) {
                log.debug("Access Token이 없거나 유효하지 않아 블랙리스트 추가 스킵: {}", e.getMessage());
            }
        }
        
        return new LogoutResponseDTO("로그아웃되었습니다.");
    }
    
    @Override
    public LoginResponseDTO refreshToken(String refreshToken) {
        log.info("Refresh Token 갱신 요청");
        
        // 1. Refresh Token 검증 및 Claims 추출
        Map<String, Object> claims = null;
        try {
            claims = jwtUtil.validateToken(refreshToken);
        } catch (Exception e) {
            log.warn("유효하지 않은 Refresh Token: {}", e.getMessage());
            throw new ApiException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 2. Refresh Token에서 사용자 ID 추출
        Long userId;
        if (claims.get("userId") != null) {
            userId = ((Number) claims.get("userId")).longValue();
        } else {
            // sub에서 fallback (하위 호환성)
            try {
                userId = Long.parseLong(claims.get("sub").toString());
            } catch (Exception e) {
                log.warn("Refresh Token에서 userId를 찾을 수 없음");
                throw new ApiException(ErrorCode.INVALID_REFRESH_TOKEN);
            }
        }
        log.debug("Refresh Token에서 userId 추출: userId={}", userId);
        
        final Long finalUserId = userId; // 람다에서 사용하기 위해 final 변수 생성
        
        // 3. Redis에서 Refresh Token 검증 (Redis 연결 실패 시 JWT 검증만으로 진행)
        try {
            if (!tokenRedisService.validateRefreshToken(finalUserId, refreshToken)) {
                log.warn("Redis에 저장된 Refresh Token과 일치하지 않음: userId={}", finalUserId);
                throw new ApiException(ErrorCode.REFRESH_TOKEN_MISMATCH);
            }
        } catch (ApiException e) {
            throw e; // 검증 실패는 그대로 전달
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 검증 스킵 (JWT 검증만으로 진행): {}", e.getMessage());
            // Redis 연결 실패 시 JWT 검증만으로 진행 (기본 기능 유지)
        }
        
        // 4. 사용자 정보 조회
        User user = userRepository.findById(finalUserId)
            .orElseThrow(() -> {
                log.warn("사용자를 찾을 수 없음: userId={}", finalUserId);
                return new ApiException(ErrorCode.USER_NOT_FOUND);
            });
        
        log.debug("사용자 조회 성공: userId={}, email={}, status={}", 
                user.getUserId(), user.getEmail(), user.getStatus());
        
        // 5. 사용자 상태 검증 (ACTIVE만 허용)
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("승인되지 않은 사용자: userId={}, status={}", user.getUserId(), user.getStatus());
            throw new ApiException(ErrorCode.USER_NOT_APPROVED);
        }
        
        // 6. 새로운 토큰 생성 및 저장
        LoginResponseDTO tokenResponse = generateTokensFromUser(user);
        
        // 7. 기존 Refresh Token 삭제 및 새 Refresh Token 저장
        try {
            tokenRedisService.deleteRefreshToken(finalUserId);
            saveRefreshToken(finalUserId, tokenResponse.getRefreshToken());
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 저장 스킵: {}", e.getMessage());
            // Redis 연결 실패 시에도 토큰 갱신은 성공 (기본 기능 유지)
        }
        
        log.info("Refresh Token 갱신 성공: userId={}, email={}", user.getUserId(), user.getEmail());
        
        return tokenResponse;
    }
    
    @Override
    public LoginResponseDTO generateTokens(com.carepilot.dto.auth.UserDTO userDTO) {
        log.debug("JWT 토큰 생성: userId={}, email={}", userDTO.getUserId(), userDTO.getEmail());
        
        String accessToken = jwtUtil.generateAccessToken(
            userDTO.getUserId(),
            userDTO.getEmail(),
            userDTO.getName(),
            userDTO.isSocial(),
            userDTO.getRole(),
            userDTO.getOrganizationId(),
            userDTO.getStatus()
        );
        
        String refreshToken = jwtUtil.generateRefreshToken(userDTO.getUserId());
        
        return new LoginResponseDTO(accessToken, refreshToken, "Bearer");
    }
    
    /**
     * User 엔티티를 UserDTO로 변환하여 토큰 생성 (내부 헬퍼 메서드)
     */
    private LoginResponseDTO generateTokensFromUser(User user) {
        com.carepilot.dto.auth.UserDTO userDTO = new com.carepilot.dto.auth.UserDTO(
            user.getUserId(),
            user.getEmail(),
            "", // password는 토큰 생성에 불필요
            user.getName() != null ? user.getName() : "",
            user.getIsSocial() != null ? user.getIsSocial() : false,
            user.getRole() != null ? user.getRole().name() : "USER",
            user.getOrganization() != null ? user.getOrganization().getOrganizationId() : null,
            user.getStatus() != null ? user.getStatus().name() : "WAITING"
        );
        return generateTokens(userDTO);
    }
    
    @Override
    public void saveRefreshToken(Long userId, String refreshToken) {
        try {
            long refreshTokenTtl = jwtUtil.getRefreshTokenValidityInSeconds();
            tokenRedisService.saveRefreshToken(userId, refreshToken, refreshTokenTtl);
            log.debug("Refresh Token 저장 완료: userId={}, ttl={}초", userId, refreshTokenTtl);
        } catch (Exception e) {
            log.warn("Redis 연결 실패, Refresh Token 저장 스킵: {}", e.getMessage());
            // Redis 연결 실패 시에도 예외를 던지지 않음 (기본 기능 유지)
        }
    }
}

