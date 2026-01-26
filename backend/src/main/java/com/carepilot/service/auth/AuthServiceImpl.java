package com.carepilot.service.auth;

import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginRequestDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class AuthServiceImpl implements AuthService {
    
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApprovalService approvalService;
    private final JwtUtil jwtUtil;
    
    private static final Random RANDOM = new Random();
    private static final String PREFIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    @Override
    public OrganizationSignupResponseDTO signupOrganization(OrganizationSignupRequestDTO request) {
        log.info("업체 회원가입 요청: organizationName={}, email={}, name={}", 
                request.getOrganizationName(), request.getEmail(), request.getName());
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("이메일 중복 시도: email={}", request.getEmail());
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        
        // organization_number 생성 (중복 시 재시도)
        String organizationNumber;
        int maxRetries = 10;
        int retries = 0;
        
        do {
            organizationNumber = generateOrganizationNumber();
            retries++;
            if (retries > maxRetries) {
                log.error("organization_number 생성 실패: 최대 재시도 횟수 초과 (maxRetries={})", maxRetries);
                throw new RuntimeException("organization_number 생성에 실패했습니다. 다시 시도해주세요.");
            }
            if (retries > 1) {
                log.debug("organization_number 중복 발생, 재시도: attempt={}, number={}", retries, organizationNumber);
            }
        } while (organizationRepository.existsByOrganizationNumber(organizationNumber));
        
        log.debug("organization_number 생성 완료: {}", organizationNumber);
        
        // Organization 생성
        Organization organization = Organization.builder()
                .name(request.getOrganizationName())
                .organizationNumber(organizationNumber)
                .build();
        organization = organizationRepository.save(organization);
        log.debug("Organization 생성 완료: organizationId={}, organizationNumber={}", 
                organization.getOrganizationId(), organizationNumber);
        
        // MANAGER User 생성
        User manager = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(null)
                .role(UserRole.MANAGER)
                .organization(organization)
                .status(UserStatus.ACTIVE)
                .isSocial(false)
                .build();
        userRepository.save(manager);
        log.info("업체 회원가입 완료: organizationNumber={}, managerEmail={}, managerId={}", 
                organizationNumber, request.getEmail(), manager.getUserId());
        
        return new OrganizationSignupResponseDTO(organizationNumber);
    }
    
    /**
     * ABC-12345 형식의 organization_number 생성
     * @return 생성된 organization_number
     */
    private String generateOrganizationNumber() {
        StringBuilder prefix = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            prefix.append(PREFIX_CHARS.charAt(RANDOM.nextInt(PREFIX_CHARS.length())));
        }
        
        int number = RANDOM.nextInt(100000);
        String numberStr = String.format("%05d", number);
        
        return prefix.toString() + "-" + numberStr;
    }
    
    @Override
    public UserSignupResponseDTO signupUser(UserSignupRequestDTO request) {
        log.info("직원 회원가입 요청: organizationNumber={}, email={}, name={}", 
                request.getOrganizationNumber(), request.getEmail(), request.getName());
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("이메일 중복 시도: email={}", request.getEmail());
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        
        // organization_number로 Organization 조회
        Organization organization = organizationRepository.findByOrganizationNumber(request.getOrganizationNumber())
                .orElseThrow(() -> {
                    log.warn("존재하지 않는 업체 번호: organizationNumber={}", request.getOrganizationNumber());
                    return new IllegalArgumentException("존재하지 않는 업체 번호입니다.");
                });
        
        log.debug("Organization 조회 성공: organizationId={}, organizationNumber={}", 
                organization.getOrganizationId(), request.getOrganizationNumber());
        
        // USER 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(null)
                .role(UserRole.USER)
                .organization(organization)
                .status(UserStatus.WAITING)
                .isSocial(false)
                .build();
        
        // approval_requested_at 기록
        user.setApprovalRequestedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("직원 회원가입 완료: userId={}, email={}, organizationId={}, status=WAITING", 
                user.getUserId(), request.getEmail(), organization.getOrganizationId());
        
        // 승인 요청 메일 발송
        sendApprovalRequestEmail(organization, user);
        
        return new UserSignupResponseDTO(
                "회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
                "WAITING"
        );
    }
    
    /**
     * 승인 요청 메일 발송
     * @param organization 조직
     * @param user 승인 요청한 사용자
     */
    private void sendApprovalRequestEmail(Organization organization, User user) {
        try {
            // 조직의 MANAGER 조회
            var managers = userRepository.findByOrganizationAndRole(organization, UserRole.MANAGER);
            
            if (managers.isEmpty()) {
                log.warn("조직에 MANAGER가 없음: organizationId={}, organizationNumber={}", 
                        organization.getOrganizationId(), organization.getOrganizationNumber());
                return;
            }
            
            // 승인 토큰 생성
            String token = approvalService.generateToken(user.getUserId());
            
            // 승인 링크 생성
            String approvalLink = approvalService.generateApprovalLink(token);
            
            // 각 MANAGER에게 메일 발송
            for (User manager : managers) {
                approvalService.sendApprovalRequestEmail(
                        manager.getEmail(),
                        user.getName(),
                        user.getEmail(),
                        approvalLink
                );
                log.info("승인 요청 메일 발송 완료: managerEmail={}, userEmail={}", 
                        manager.getEmail(), user.getEmail());
            }
        } catch (Exception e) {
            log.error("승인 요청 메일 발송 실패: userId={}, error={}", user.getUserId(), e.getMessage(), e);
            // 메일 발송 실패해도 회원가입은 성공 처리
        }
    }
    
    @Override
    public ApprovalResponseDTO approveUser(String token) {
        log.info("승인 요청: token={}", token);
        
        // 1. 토큰 검증
        Long userId = approvalService.validateToken(token);
        if (userId == null) {
            log.warn("유효하지 않은 승인 토큰: token={}", token);
            throw new IllegalArgumentException("유효하지 않거나 만료된 승인 토큰입니다.");
        }
        
        log.debug("토큰 검증 성공: userId={}", userId);
        
        // 2. 승인 대상 USER 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("승인 대상 사용자를 찾을 수 없음: userId={}", userId);
                    return new IllegalArgumentException("승인 대상 사용자를 찾을 수 없습니다.");
                });
        
        log.debug("승인 대상 사용자 조회: userId={}, email={}, status={}", 
                user.getUserId(), user.getEmail(), user.getStatus());
        
        // 3. 이미 승인된 경우 체크
        if (user.getStatus() == UserStatus.ACTIVE) {
            log.warn("이미 승인된 사용자: userId={}, email={}", user.getUserId(), user.getEmail());
            throw new IllegalArgumentException("이미 승인된 사용자입니다.");
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
    public LoginResponseDTO login(LoginRequestDTO request) {
        log.info("로그인 요청: email={}", request.getEmail());
        
        // 1. 이메일로 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("존재하지 않는 이메일로 로그인 시도: email={}", request.getEmail());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
                });
        
        log.debug("사용자 조회 성공: userId={}, email={}, status={}", 
                user.getUserId(), user.getEmail(), user.getStatus());
        
        // 2. BCrypt 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("비밀번호 불일치: email={}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        
        log.debug("비밀번호 검증 성공: email={}", request.getEmail());
        
        // 3. status 검사 (ACTIVE만 허용)
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("승인되지 않은 사용자 로그인 시도: email={}, status={}", 
                    request.getEmail(), user.getStatus());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "승인되지 않은 사용자입니다. 관리자 승인 후 로그인할 수 있습니다.");
        }
        
        log.debug("사용자 상태 검증 성공: status=ACTIVE");
        
        // 4. JWT 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(
                user.getUserId(),
                user.getRole().name(),
                user.getOrganization().getOrganizationId(),
                user.getStatus().name()
        );
        
        String refreshToken = jwtUtil.generateRefreshToken(user.getUserId());
        
        log.info("로그인 성공: userId={}, email={}, role={}", 
                user.getUserId(), user.getEmail(), user.getRole());
        
        // 5. LoginResponseDTO 반환
        return new LoginResponseDTO(accessToken, refreshToken, "Bearer");
    }

    @Override
    public LogoutResponseDTO logout() {
        // Stateless 방식이므로 서버에서는 특별한 처리가 필요 없음
        // 프론트엔드에서 토큰을 삭제하면 됨
        
        Long currentUserId = com.carepilot.security.util.SecurityUtil.getCurrentUserId();
        log.info("로그아웃 요청: userId={}", currentUserId);
        
        return new LogoutResponseDTO("로그아웃되었습니다.");
    }
}

