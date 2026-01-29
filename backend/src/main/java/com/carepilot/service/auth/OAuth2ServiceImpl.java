package com.carepilot.service.auth;

import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * OAuth2 소셜 로그인 서비스 구현
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class OAuth2ServiceImpl implements OAuth2Service {
    
    private final UserRepository userRepository;
    private final AuthService authService;
    
    @Override
    public OAuth2LoginResponseDTO processKakaoLogin(String email, String name, String providerId) {
        log.info("카카오 소셜 로그인 처리 시작: email={}, name={}, providerId={}", email, name, providerId);
        
        // 1. 기존 사용자 조회
        User existingUser = userRepository.findByEmail(email).orElse(null);
        
        if (existingUser != null) {
            log.debug("기존 사용자 발견: userId={}, role={}, status={}", 
                    existingUser.getUserId(), existingUser.getRole(), existingUser.getStatus());
            
            // 2-1. 기존 사용자가 ACTIVE면 JWT 토큰 발급하여 로그인
            if (existingUser.getStatus() == UserStatus.ACTIVE) {
                log.info("기존 사용자 로그인 성공: userId={}, role={}", 
                        existingUser.getUserId(), existingUser.getRole());
                
                // User 엔티티를 UserDTO로 변환하여 토큰 생성
                UserDTO userDTO = new UserDTO(
                    existingUser.getUserId(),
                    existingUser.getEmail(),
                    "", // password는 토큰 생성에 불필요
                    existingUser.getName() != null ? existingUser.getName() : "",
                    existingUser.getIsSocial() != null ? existingUser.getIsSocial() : false,
                    existingUser.getRole() != null ? existingUser.getRole().name() : "USER",
                    existingUser.getOrganization() != null ? existingUser.getOrganization().getOrganizationId() : null,
                    existingUser.getStatus() != null ? existingUser.getStatus().name() : "ACTIVE"
                );
                
                // AuthService를 통해 토큰 생성 및 저장
                LoginResponseDTO tokenResponse = authService.generateTokens(userDTO);
                authService.saveRefreshToken(existingUser.getUserId(), tokenResponse.getRefreshToken());
                
                return OAuth2LoginResponseDTO.success(
                    tokenResponse.getAccessToken(),
                    tokenResponse.getRefreshToken(),
                    existingUser.getRole().name(),
                    existingUser.getStatus().name()
                );
            }
            
            // 2-2. 기존 사용자가 WAITING이면 승인 대기 메시지
            if (existingUser.getStatus() == UserStatus.WAITING) {
                log.info("기존 사용자 승인 대기 중: userId={}", existingUser.getUserId());
                return OAuth2LoginResponseDTO.waitingApproval();
            }
            
            // 2-3. 그 외 상태 (DENIED, DISABLED 등)
            log.warn("기존 사용자 로그인 불가: userId={}, status={}", 
                    existingUser.getUserId(), existingUser.getStatus());
            return OAuth2LoginResponseDTO.requiresAdditionalInfo(
                "로그인할 수 없는 상태입니다. 관리자에게 문의하세요."
            );
        }
        
        // 3. 신규 사용자 - USER만 소셜 회원가입 가능
        // USER는 organization_number 입력이 필요함
        // MANAGER는 소셜 로그인 불가
        
        log.info("신규 카카오 사용자: email={}, name={}", email, name);
        return OAuth2LoginResponseDTO.requiresAdditionalInfo(
            "추가 정보 입력이 필요합니다. 비밀번호와 organization_number를 입력해주세요."
        );
    }
    
}

