package com.carepilot.service.auth;

import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.JwtUtil;
import com.carepilot.service.auth.ApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * OAuth2 소셜 로그인 서비스 구현
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class OAuth2ServiceImpl implements OAuth2Service {
    
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtUtil jwtUtil;
    private final ApprovalService approvalService;
    
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
                
                String accessToken = jwtUtil.generateAccessToken(
                    existingUser.getUserId(),
                    existingUser.getRole().name(),
                    existingUser.getOrganization() != null ? existingUser.getOrganization().getOrganizationId() : null,
                    existingUser.getStatus().name()
                );
                
                String refreshToken = jwtUtil.generateRefreshToken(existingUser.getUserId());
                
                return OAuth2LoginResponseDTO.success(
                    accessToken,
                    refreshToken,
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
        
        // 3. 신규 사용자 - Role 판단 필요
        // 카카오 로그인 시 Role을 알 수 없으므로, 추가 정보 입력이 필요함
        // ADMIN은 즉시 ACTIVE로 회원가입 가능하지만, 
        // USER는 organization_number 입력이 필요함
        // MANAGER는 소셜 로그인 불가
        
        log.info("신규 카카오 사용자: email={}, name={}", email, name);
        return OAuth2LoginResponseDTO.requiresAdditionalInfo(
            "추가 정보 입력이 필요합니다. Role과 organization_number를 입력해주세요."
        );
    }
    
    /**
     * ADMIN 소셜 회원가입 (즉시 ACTIVE)
     * @param email 카카오 이메일
     * @param name 카카오 닉네임
     * @return 로그인 응답 (JWT 토큰)
     */
    public OAuth2LoginResponseDTO signupAdmin(String email, String name) {
        log.info("ADMIN 소셜 회원가입: email={}, name={}", email, name);
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }
        
        // ADMIN 사용자 생성 (password 없음, status = ACTIVE)
        User adminUser = User.builder()
            .email(email)
            .password(null)  // 소셜 로그인은 password 없음
            .name(name)
            .role(UserRole.ADMIN)
            .organization(null)  // ADMIN은 organization 없음
            .status(UserStatus.ACTIVE)  // ADMIN은 즉시 ACTIVE
            .isSocial(true)
            .build();
        
        adminUser = userRepository.save(adminUser);
        log.info("ADMIN 소셜 회원가입 완료: userId={}", adminUser.getUserId());
        
        // JWT 토큰 발급
        String accessToken = jwtUtil.generateAccessToken(
            adminUser.getUserId(),
            adminUser.getRole().name(),
            null,  // ADMIN은 organization 없음
            adminUser.getStatus().name()
        );
        
        String refreshToken = jwtUtil.generateRefreshToken(adminUser.getUserId());
        
        log.info("ADMIN 소셜 로그인 성공: userId={}, accessToken 발급 완료", adminUser.getUserId());
        
        return OAuth2LoginResponseDTO.success(
            accessToken,
            refreshToken,
            adminUser.getRole().name(),
            adminUser.getStatus().name()
        );
    }
    
    /**
     * USER 소셜 회원가입 (organization_number 필요, status = WAITING)
     * @param email 카카오 이메일
     * @param name 카카오 닉네임
     * @param organizationNumber 조직 번호
     * @return 로그인 응답 (승인 대기)
     */
    public OAuth2LoginResponseDTO signupUser(String email, String name, String organizationNumber) {
        log.info("USER 소셜 회원가입: email={}, name={}, organizationNumber={}", 
                email, name, organizationNumber);
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }
        
        // organizationNumber로 Organization 조회
        Organization organization = organizationRepository.findByOrganizationNumber(organizationNumber)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조직 번호입니다."));
        
        // USER 사용자 생성 (password 없음, status = WAITING)
        User user = User.builder()
            .email(email)
            .password(null)  // 소셜 로그인은 password 없음
            .name(name)
            .role(UserRole.USER)
            .organization(organization)
            .status(UserStatus.WAITING)  // USER는 승인 필요
            .isSocial(true)
            .build();
        
        user.setApprovalRequestedAt(LocalDateTime.now());
        
        user = userRepository.save(user);
        log.info("USER 소셜 회원가입 완료: userId={}, organizationId={}, status=WAITING", 
                user.getUserId(), organization.getOrganizationId());
        
        // 승인 메일 발송
        String approvalToken = approvalService.generateToken(user.getUserId());
        String approvalLink = approvalService.generateApprovalLink(approvalToken);
        
        // 조직의 MANAGER에게 승인 메일 발송
        List<User> managers = userRepository.findByOrganizationAndRole(organization, UserRole.MANAGER);
        if (!managers.isEmpty()) {
            for (User manager : managers) {
                approvalService.sendApprovalRequestEmail(
                    manager.getEmail(),
                    user.getName(),
                    user.getEmail(),
                    approvalLink
                );
                log.info("USER 소셜 회원가입 승인 요청 메일 발송: managerEmail={}, userEmail={}", 
                        manager.getEmail(), user.getEmail());
            }
        } else {
            log.warn("조직에 MANAGER가 없음: organizationId={}, organizationNumber={}", 
                    organization.getOrganizationId(), organization.getOrganizationNumber());
        }
        
        return OAuth2LoginResponseDTO.waitingApproval();
    }
}

