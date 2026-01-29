package com.carepilot.controller.user;

import com.carepilot.dto.user.UserResponseDTO;
import com.carepilot.dto.user.UserUpdateRequestDTO;
import com.carepilot.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

//사용자 컨트롤러
//개인정보 조회 및 수정, 직원 관리
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Log4j2
public class UserController {
    
    private final UserService userService;
    
    //현재 로그인한 사용자의 개인정보 조회
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getCurrentUserProfile() {
        log.info("GET /api/users/profile 요청 수신");
        try {
            UserResponseDTO response = userService.getCurrentUserProfile();
            log.info("GET /api/users/profile 성공: email={}", response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("GET /api/users/profile 실패: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    //현재 로그인한 사용자의 개인정보 수정
    @PutMapping("/profile")
    public ResponseEntity<UserResponseDTO> updateCurrentUserProfile(
            @RequestBody UserUpdateRequestDTO request) {
        log.info("PUT /api/users/profile 요청 수신: name={}, email={}, phone={}", 
                request.getName(), request.getEmail(), request.getPhone());
        try {
            UserResponseDTO response = userService.updateCurrentUserProfile(request);
            log.info("PUT /api/users/profile 성공: email={}", response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("PUT /api/users/profile 실패: {}", e.getMessage(), e);
            throw e;
        }
    }

    // [직원 관리] 직원 목록 조회
    @GetMapping("/staff")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<UserResponseDTO>> getStaffList() {
        log.info("GET /api/users/staff 요청 수신");
        return ResponseEntity.ok(userService.getStaffList());
    }

    // [직원 관리] 직원 상태 변경 (승인 ACTIVE, 거부 DENIED, 중지 DISABLED 등)
    @PatchMapping("/staff/{userId}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> updateStaffStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        log.info("PATCH /api/users/staff/{}/status 요청 수신: status={}", userId, status);
        userService.updateStaffStatus(userId, status);
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다."));
    }

    // [직원 관리] 직원 권한 변경 (USER, MANAGER 등)
    @PatchMapping("/staff/{userId}/role")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> updateStaffRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        String role = request.get("role");
        log.info("PATCH /api/users/staff/{}/role 요청 수신: role={}", userId, role);
        userService.updateStaffRole(userId, role);
        return ResponseEntity.ok(Map.of("message", "권한이 변경되었습니다."));
    }
}
