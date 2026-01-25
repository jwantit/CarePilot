package com.carepilot.controller.auth;

import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginRequestDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;
import com.carepilot.dto.auth.OAuth2LoginResponseDTO;
import com.carepilot.dto.auth.OAuth2SignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;
import com.carepilot.service.auth.AuthService;
import com.carepilot.service.auth.OAuth2Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Log4j2
public class AuthController {
    
    private final AuthService authService;
    private final OAuth2Service oAuth2Service;
    
    @PostMapping("/signup/organization")
    public ResponseEntity<OrganizationSignupResponseDTO> signupOrganization(
            @RequestBody OrganizationSignupRequestDTO request) {
        log.info("POST /auth/signup/organization 요청 수신");
        try {
            OrganizationSignupResponseDTO response = authService.signupOrganization(request);
            log.info("POST /auth/signup/organization 성공: organizationNumber={}", response.getOrganizationNumber());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("POST /auth/signup/organization 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/signup/user")
    public ResponseEntity<UserSignupResponseDTO> signupUser(
            @RequestBody UserSignupRequestDTO request) {
        log.info("POST /auth/signup/user 요청 수신");
        try {
            UserSignupResponseDTO response = authService.signupUser(request);
            log.info("POST /auth/signup/user 성공: email={}, status={}", request.getEmail(), response.getStatus());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("POST /auth/signup/user 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/approve")
    public ResponseEntity<ApprovalResponseDTO> approveUser(
            @RequestParam("token") String token) {
        log.info("GET /auth/approve 요청 수신: token={}", token);
        try {
            ApprovalResponseDTO response = authService.approveUser(token);
            log.info("GET /auth/approve 성공: email={}, status={}", response.getEmail(), response.getStatus());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("GET /auth/approve 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build(); // 400 Bad Request
        } catch (Exception e) {
            log.error("GET /auth/approve 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500 Internal Server Error
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @RequestBody LoginRequestDTO request) {
        log.info("POST /auth/login 요청 수신: email={}", request.getEmail());
        try {
            LoginResponseDTO response = authService.login(request);
            log.info("POST /auth/login 성공: email={}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // Service에서 던진 ResponseStatusException 그대로 전달
            log.warn("POST /auth/login 실패: status={}, message={}", e.getStatusCode(), e.getReason());
            throw e;
        } catch (Exception e) {
            log.error("POST /auth/login 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500 Internal Server Error
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDTO> logout() {
        log.info("POST /auth/logout 요청 수신");
        try {
            LogoutResponseDTO response = authService.logout();
            log.info("POST /auth/logout 성공");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("POST /auth/logout 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    //ADMIN 소셜 회원가입 (즉시 ACTIVE)
    @PostMapping("/oauth2/signup/admin")
    public ResponseEntity<OAuth2LoginResponseDTO> signupAdmin(
            @RequestBody OAuth2SignupRequestDTO request) {
        log.info("POST /auth/oauth2/signup/admin 요청 수신: email={}, name={}", 
                request.getEmail(), request.getName());
        try {
            OAuth2LoginResponseDTO response = oAuth2Service.signupAdmin(request.getEmail(), request.getName());
            log.info("POST /auth/oauth2/signup/admin 성공: email={}", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("POST /auth/oauth2/signup/admin 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("POST /auth/oauth2/signup/admin 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    //USER 소셜 회원가입 (organization_number 필요, status = WAITING)
    @PostMapping("/oauth2/signup/user")
    public ResponseEntity<OAuth2LoginResponseDTO> signupUserOAuth2(
            @RequestBody OAuth2SignupRequestDTO request) {
        log.info("POST /auth/oauth2/signup/user 요청 수신: email={}, name={}, organizationNumber={}", 
                request.getEmail(), request.getName(), request.getOrganizationNumber());
        try {
            OAuth2LoginResponseDTO response = oAuth2Service.signupUser(
                    request.getEmail(), request.getName(), request.getOrganizationNumber());
            log.info("POST /auth/oauth2/signup/user 성공: email={}, status=WAITING", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("POST /auth/oauth2/signup/user 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("POST /auth/oauth2/signup/user 실패 (서버 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


