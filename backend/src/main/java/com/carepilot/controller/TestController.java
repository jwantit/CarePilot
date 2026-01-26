package com.carepilot.controller;

import com.carepilot.security.util.UserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

//Spring Security 및 JWT 필터 테스트용 컨트롤러
@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
@Log4j2
public class TestController {

    private final UserUtil userUtil;

    //인증이 필요한 엔드포인트 (모든 인증된 사용자 접근 가능)
    @GetMapping("/protected")
    public ResponseEntity<Map<String, Object>> protectedEndpoint() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "보호된 엔드포인트 접근 성공");
        response.put("principal", authentication.getPrincipal());
        response.put("authorities", authentication.getAuthorities());
        
        log.info("보호된 엔드포인트 접근: principal={}, authorities={}", 
                authentication.getPrincipal(), authentication.getAuthorities());
        
        return ResponseEntity.ok(response);
    }

    //ADMIN 전용 엔드포인트
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminEndpoint() {
        log.info("ADMIN 전용 엔드포인트 접근");
        return ResponseEntity.ok(Map.of("message", "ADMIN 전용 엔드포인트 접근 성공"));
    }

    //MANAGER 전용 엔드포인트
    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> managerEndpoint() {
        log.info("MANAGER 전용 엔드포인트 접근");
        return ResponseEntity.ok(Map.of("message", "MANAGER 전용 엔드포인트 접근 성공"));
    }

    //USER 전용 엔드포인트
    @GetMapping("/user")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> userEndpoint() {
        log.info("USER 전용 엔드포인트 접근");
        return ResponseEntity.ok(Map.of("message", "USER 전용 엔드포인트 접근 성공"));
    }

    //조직 범위 제한 테스트 엔드포인트
    //MANAGER는 자기 organization_id만 접근 가능
    //ADMIN은 모든 조직 접근 가능
    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> organizationEndpoint(
            @PathVariable Long organizationId) {
        
        com.carepilot.dto.auth.UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long currentUserId = userDTO.getUserId();
        String currentRole = userDTO.getRole();
        Long currentOrgId = userDTO.getOrganizationId();
        
        log.info("조직 접근 시도: userId={}, role={}, currentOrgId={}, targetOrgId={}",
                currentUserId, currentRole, currentOrgId, organizationId);
        
        // MANAGER는 자기 조직만 접근 가능
        if ("MANAGER".equals(currentRole)) {
            if (currentOrgId == null || !currentOrgId.equals(organizationId)) {
                log.warn("MANAGER가 다른 조직 접근 시도: currentOrgId={}, targetOrgId={}",
                        currentOrgId, organizationId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 조직의 데이터에 접근할 수 없습니다.");
            }
        }
        
        // ADMIN은 모든 조직 접근 가능 (검증 통과)
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "조직 데이터 접근 성공");
        response.put("organizationId", organizationId);
        response.put("currentUserId", currentUserId);
        response.put("currentRole", currentRole);
        response.put("currentOrganizationId", currentOrgId);
        
        log.info("조직 접근 성공: organizationId={}, role={}", organizationId, currentRole);
        
        return ResponseEntity.ok(response);
    }
}

