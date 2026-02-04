package com.carepilot.service.auth;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 회원가입 서비스 구현
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class SignupServiceImpl implements SignupService {
    
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApprovalService approvalService;
    private final SimpMessagingTemplate messagingTemplate;
    
    private static final Random RANDOM = new Random();
    private static final String PREFIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    @Override
    public OrganizationSignupResponseDTO signupOrganization(OrganizationSignupRequestDTO request) {
        log.info("업체 회원가입 요청: organizationName={}, email={}, name={}", 
                request.getOrganizationName(), request.getEmail(), request.getName());
        
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new ApiException(ErrorCode.PHONE_REQUIRED);
        }
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("이메일 중복 시도: email={}", request.getEmail());
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
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
                throw new ApiException(ErrorCode.ORGANIZATION_NUMBER_GENERATION_FAILED);
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
                .phone(formatPhone(request.getPhone()))
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
    
    @Override
    public UserSignupResponseDTO signupUser(UserSignupRequestDTO request) {
        log.info("직원 회원가입 요청: organizationNumber={}, email={}, name={}", 
                request.getOrganizationNumber(), request.getEmail(), request.getName());
        
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new ApiException(ErrorCode.PHONE_REQUIRED);
        }
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("이메일 중복 시도: email={}", request.getEmail());
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        
        // organization_number로 Organization 조회
        Organization organization = organizationRepository.findByOrganizationNumber(request.getOrganizationNumber())
                .orElseThrow(() -> {
                    log.warn("존재하지 않는 업체 번호: organizationNumber={}", request.getOrganizationNumber());
                    return new ApiException(ErrorCode.ORGANIZATION_NOT_FOUND);
                });
        
        log.debug("Organization 조회 성공: organizationId={}, organizationNumber={}", 
                organization.getOrganizationId(), request.getOrganizationNumber());
        
        // USER 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(formatPhone(request.getPhone()))
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
    
    @Override
    public OAuth2LoginResponseDTO signupUserOAuth2(String email, String name, String password, String organizationNumber) {
        log.info("USER 소셜 회원가입: email={}, name={}, organizationNumber={}", 
                email, name, organizationNumber);
        
        // 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        
        // organizationNumber로 Organization 조회
        Organization organization = organizationRepository.findByOrganizationNumber(organizationNumber)
            .orElseThrow(() -> new ApiException(ErrorCode.ORGANIZATION_NOT_FOUND));
        
        // USER 사용자 생성 (password 암호화, status = WAITING)
        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(password))  // 비밀번호 암호화
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
        sendApprovalRequestEmail(organization, user);
        
        return OAuth2LoginResponseDTO.waitingApproval();
    }
    
    /** 숫자만 추출 후 010-XXXX-XXXX 형식으로 포맷 (null/blank면 null, 11자리 초과 시 앞 11자리만) */
    private static String formatPhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.isEmpty()) return null;
        if (digits.length() > 11) digits = digits.substring(0, 11);
        if (digits.length() <= 3) return digits;
        if (digits.length() <= 7) return digits.substring(0, 3) + "-" + digits.substring(3);
        return digits.substring(0, 3) + "-" + digits.substring(3, 7) + "-" + digits.substring(7);
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

            // MANAGER에게 앱 내 토스트 알림 (개인 큐로 전송, 이메일 알림 설정 연동)
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "SIGNUP_APPROVAL_REQUEST");
            payload.put("userName", user.getName());
            payload.put("userEmail", user.getEmail());
            payload.put("title", "회원가입 승인 요청");
            payload.put("text", user.getName() + "(" + user.getEmail() + ")님이 회원가입 승인을 요청했습니다.");
            
            // 각 MANAGER에게 개인 큐로 전송
            for (User manager : managers) {
                String userQueue = "/queue/users/" + manager.getUserId();
                messagingTemplate.convertAndSend(userQueue, payload);
                log.debug("회원가입 승인 요청 WebSocket 전송: userQueue={}, managerId={}", userQueue, manager.getUserId());
            }
        } catch (Exception e) {
            log.error("승인 요청 메일 발송 실패: userId={}, error={}", user.getUserId(), e.getMessage(), e);
            // 메일 발송 실패해도 회원가입은 성공 처리
        }
    }
}

