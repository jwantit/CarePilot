package com.carepilot.security.service;

import com.carepilot.domain.user.User;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.auth.TokenRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Log4j2
@RequiredArgsConstructor
// 로그인 시 입력한 아이디로 DB에서 유저 정보와 권한을 가져오는 클래스
public class AuthUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final TokenRedisService tokenRedisService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        log.info("----------------loadUserByUsername-----------------------------");

        // 1. Redis에서 로그인 차단 여부 먼저 확인 (Brute Force 방지)
        if (tokenRedisService.isLoginBlocked(username)) {
            log.warn("차단된 계정의 로그인 시도: email={}", username);
            throw new LockedException("TOO_MANY_ATTEMPTS");
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Not Found: " + username) // new APILoginFailHandler() 가 호출됨
                );

        UserDTO userDTO = new UserDTO(
                user.getUserId(),
                user.getEmail(),
                user.getPassword() != null ? user.getPassword() : "",
                user.getName() != null ? user.getName() : "",
                user.getIsSocial() != null ? user.getIsSocial() : false,
                user.getRole() != null ? user.getRole().name() : "USER",
                user.getOrganization() != null ? user.getOrganization().getOrganizationId() : null,
                user.getStatus() != null ? user.getStatus().name() : "WAITING"
        );

        // 비밀번호 제외하고 로깅 (보안)
        log.info("사용자 로드 완료: userId={}, email={}, role={}, status={}", 
                userDTO.getUserId(), userDTO.getEmail(), userDTO.getRole(), userDTO.getStatus());

        return userDTO;

    }

}

