package com.carepilot.service.user;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.user.UserResponseDTO;
import com.carepilot.dto.user.UserUpdateRequestDTO;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.UserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

//사용자 서비스 구현
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final UserUtil userUtil;
    
    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUserProfile() {
        log.info("현재 사용자 개인정보 조회 요청");
        
        User user = userUtil.getCurrentUser();
        
        // Lazy 로딩을 위해 organization을 명시적으로 로드
        if (user.getOrganization() != null) {
            user.getOrganization().getName(); // Lazy 초기화
        }
        
        log.info("현재 사용자 개인정보 조회 성공: userId={}, email={}", 
                user.getUserId(), user.getEmail());
        
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .organization(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .organizationNumber(user.getOrganization() != null ? user.getOrganization().getOrganizationNumber() : null)
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }
    
    @Override
    public UserResponseDTO updateCurrentUserProfile(UserUpdateRequestDTO request) {
        log.info("현재 사용자 개인정보 수정 요청: name={}, email={}, phone={}", 
                request.getName(), request.getEmail(), request.getPhone());
        
        User user = userUtil.getCurrentUser();
        
        // 이메일 중복 체크 (다른 사용자가 이미 사용 중인지)
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                log.warn("이메일 중복 시도: email={}", request.getEmail());
                throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }
        
        // 개인정보 수정
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        
        userRepository.save(user);
        
        log.info("현재 사용자 개인정보 수정 성공: userId={}, email={}", 
                user.getUserId(), user.getEmail());
        
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .organization(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .organizationNumber(user.getOrganization() != null ? user.getOrganization().getOrganizationNumber() : null)
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getStaffList() {
        User manager = userUtil.getCurrentUser();
        log.info("조직 직원 목록 조회 요청: organization={}", manager.getOrganization().getName());

        return userRepository.findByOrganization(manager.getOrganization()).stream()
                .map(user -> UserResponseDTO.builder()
                        .userId(user.getUserId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .status(user.getStatus().name())
                        .approvalRequestedAt(user.getApprovalRequestedAt())
                        .approvalProcessedAt(user.getApprovalProcessedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void updateStaffStatus(Long userId, String status) {
        User manager = userUtil.getCurrentUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        // 같은 조직인지 검증
        if (!targetUser.getOrganization().getOrganizationId().equals(manager.getOrganization().getOrganizationId())) {
            log.warn("권한 없는 직원 상태 변경 시도: manager={}, target={}", manager.getUserId(), targetUser.getUserId());
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }

        try {
            UserStatus newStatus = UserStatus.valueOf(status.toUpperCase());
            targetUser.setStatus(newStatus);
            userRepository.save(targetUser);
            log.info("직원 상태 변경 완료: userId={}, newStatus={}", userId, newStatus);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "유효하지 않은 상태값입니다.");
        }
    }

    @Override
    public void updateStaffRole(Long userId, String role) {
        User manager = userUtil.getCurrentUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        // 같은 조직인지 검증
        if (!targetUser.getOrganization().getOrganizationId().equals(manager.getOrganization().getOrganizationId())) {
            log.warn("권한 없는 직원 권한 변경 시도: manager={}, target={}", manager.getUserId(), targetUser.getUserId());
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }

        try {
            UserRole newRole = UserRole.valueOf(role.toUpperCase());
            targetUser.setRole(newRole);
            userRepository.save(targetUser);
            log.info("직원 권한 변경 완료: userId={}, newRole={}", userId, newRole);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "유효하지 않은 권한값입니다.");
        }
    }
}
