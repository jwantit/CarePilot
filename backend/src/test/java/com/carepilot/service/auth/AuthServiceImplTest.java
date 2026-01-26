package com.carepilot.service.auth;

import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Log4j2
class AuthServiceImplTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("organization_number 형식이 ABC-12345 형식인지 검증")
    void testOrganizationNumberFormat() {
        // given
        OrganizationSignupRequestDTO request = new OrganizationSignupRequestDTO();
        request.setOrganizationName("테스트 병원");
        request.setEmail("manager@test.com");
        request.setPassword("password123");
        request.setName("관리자");

        // when
        OrganizationSignupResponseDTO response = authService.signupOrganization(request);
        String organizationNumber = response.getOrganizationNumber();

        // then
        assertThat(organizationNumber).matches("^[A-Z]{3}-\\d{5}$");
        log.info("✅ organization_number 형식 검증 통과: {}", organizationNumber);
    }

    @Test
    @DisplayName("업체 회원가입 시 Organization과 MANAGER User가 동시에 생성되는지 확인")
    void testOrganizationAndManagerCreation() {
        // given
        OrganizationSignupRequestDTO request = new OrganizationSignupRequestDTO();
        request.setOrganizationName("테스트 병원");
        request.setEmail("manager@test.com");
        request.setPassword("password123");
        request.setName("관리자");

        // when
        OrganizationSignupResponseDTO response = authService.signupOrganization(request);

        // then
        // Organization 확인
        var organizationOpt = organizationRepository.findByOrganizationNumber(response.getOrganizationNumber());
        assertThat(organizationOpt).isPresent();

        // MANAGER User 확인
        var userOpt = userRepository.findByEmail("manager@test.com");
        assertThat(userOpt).isPresent()
                .hasValueSatisfying(user -> {
                    assertThat(user.getRole().name()).isEqualTo("MANAGER");
                    assertThat(user.getStatus().name()).isEqualTo("ACTIVE");
                    assertThat(user.getOrganization()).isNotNull();
                    assertThat(user.getOrganization().getOrganizationNumber())
                            .isEqualTo(response.getOrganizationNumber());
                });
        
        log.info("✅ Organization과 MANAGER 동시 생성 검증 통과: orgNumber={}, managerEmail={}", 
                response.getOrganizationNumber(), "manager@test.com");
    }

    @Test
    @DisplayName("이메일 중복 시 예외 발생")
    void testDuplicateEmailException() {
        // given
        OrganizationSignupRequestDTO request1 = new OrganizationSignupRequestDTO();
        request1.setOrganizationName("병원1");
        request1.setEmail("duplicate@test.com");
        request1.setPassword("password123");
        request1.setName("관리자1");

        OrganizationSignupRequestDTO request2 = new OrganizationSignupRequestDTO();
        request2.setOrganizationName("병원2");
        request2.setEmail("duplicate@test.com"); // 동일한 이메일
        request2.setPassword("password456");
        request2.setName("관리자2");

        // when & then
        authService.signupOrganization(request1);
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> authService.signupOrganization(request2)
        );
        log.info("✅ 이메일 중복 검증 통과: 중복 이메일로 예외 발생");
    }
    
    @Test
    @DisplayName("직원 회원가입 시 승인 요청 메일 발송 확인")
    void testUserSignupSendsApprovalEmail() {
        // given
        // 1. 업체 회원가입 (MANAGER 생성)
        OrganizationSignupRequestDTO orgRequest = new OrganizationSignupRequestDTO();
        orgRequest.setOrganizationName("테스트 병원");
        orgRequest.setEmail("manager@test.com");
        orgRequest.setPassword("password123");
        orgRequest.setName("관리자");
        OrganizationSignupResponseDTO orgResponse = authService.signupOrganization(orgRequest);
        
        // 2. 직원 회원가입
        UserSignupRequestDTO userRequest = new UserSignupRequestDTO();
        userRequest.setOrganizationNumber(orgResponse.getOrganizationNumber());
        userRequest.setEmail("staff2@test.com");
        userRequest.setPassword("password123");
        userRequest.setName("직원");
        
        // when
        UserSignupResponseDTO response = authService.signupUser(userRequest);
        
        // then
        assertThat(response.getStatus()).isEqualTo("WAITING");
        
        // USER가 WAITING 상태인지 확인
        assertThat(userRepository.findByEmail("staff2@test.com"))
                .isPresent()
                .hasValueSatisfying(user -> {
                    assertThat(user.getStatus()).isEqualTo(UserStatus.WAITING);
                    assertThat(user.getRole()).isEqualTo(UserRole.USER);
                    assertThat(user.getApprovalRequestedAt()).isNotNull();
                    assertThat(user.getOrganization()).isNotNull();
                });
        
        // MANAGER 조회 확인 (승인 메일 발송 대상)
        var organization = organizationRepository.findByOrganizationNumber(orgResponse.getOrganizationNumber()).get();
        var managers = userRepository.findByOrganizationAndRole(organization, UserRole.MANAGER);
        assertThat(managers).isNotEmpty();
        
        log.info("✅ 직원 회원가입 및 승인 요청 메일 발송 검증 통과: userEmail={}, status={}", 
                "staff2@test.com", response.getStatus());
    }
    
    @Test
    @DisplayName("직원 회원가입 시 잘못된 organization_number로 예외 발생")
    void testUserSignupWithInvalidOrganizationNumber() {
        // given
        UserSignupRequestDTO request = new UserSignupRequestDTO();
        request.setOrganizationNumber("INVALID-99999");
        request.setEmail("staff@test.com");
        request.setPassword("password123");
        request.setName("직원");
        
        // when & then
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> authService.signupUser(request)
        );
        log.info("✅ 잘못된 organization_number 검증 통과: 예외 발생");
    }
}

