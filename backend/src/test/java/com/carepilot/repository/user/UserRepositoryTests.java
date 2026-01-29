package com.carepilot.repository.user;

import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@SpringBootTest
@Log4j2
public class UserRepositoryTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testInsertUser() {
        Organization orgA = organizationRepository.findById(1L).orElseThrow();
        Organization orgB = organizationRepository.findById(2L).orElseThrow();

        for (int i = 0; i < 10; i++) {
            UserRole role = UserRole.USER;
            UserStatus status = UserStatus.WAITING;
            Organization organization = orgA;

            // 0~2 : USER (WAITING)
            if (i < 3) {
                role = UserRole.USER;
                status = UserStatus.WAITING;
                organization = null;
            }
            // 3~4 : USER (ACTIVE)
            else if (i < 5) {
                role = UserRole.USER;
                status = UserStatus.ACTIVE;
                organization = orgA;
            }
            // 5~6 : MANAGER (업체 A)
            else if (i < 7) {
                role = UserRole.MANAGER;
                status = UserStatus.ACTIVE;
                organization = orgA;
            }
            // 7~8 : MANAGER (업체 B)
            else if (i < 9) {
                role = UserRole.MANAGER;
                status = UserStatus.ACTIVE;
                organization = orgB;
            }
            // 9 : ADMIN
            else {
                role = UserRole.ADMIN;
                status = UserStatus.ACTIVE;
                organization = null;
            }

            User user = User.builder()
                    .email("user" + i + "@test.com")
                    .password(passwordEncoder.encode("1111"))
                    .name("USER" + i)
                    .role(role)
                    .organization(organization)
                    .status(status)
                    .isSocial(false)
                    .build();

            if (status == UserStatus.WAITING) {
                user.setApprovalRequestedAt(LocalDateTime.now());
            }

            userRepository.save(user);
            log.info("유저 생성: {} - {} - {}", user.getEmail(), role, status);
        }
    }

    @Transactional
    @Test
    public void testRead() {
        String email = "user3@test.com";
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        log.info("유저 조회: {}", user.getEmail());
        log.info("역할: {}", user.getRole());
        log.info("상태: {}", user.getStatus());
    }
}

