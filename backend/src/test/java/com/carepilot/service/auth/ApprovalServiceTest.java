package com.carepilot.service.auth;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Log4j2
class ApprovalServiceTest {
    
    @Autowired
    private ApprovalService approvalService;
    
    @Test
    @DisplayName("승인 토큰 생성 및 검증 성공")
    void testGenerateAndValidateToken() {
        // given
        Long userId = 1L;
        
        // when
        String token = approvalService.generateToken(userId);
        Long validatedUserId = approvalService.validateToken(token);
        
        // then
        assertThat(token).isNotNull();
        assertThat(validatedUserId).isEqualTo(userId);
        log.info("✅ 토큰 생성 및 검증 통과: userId={}", userId);
    }
    
    @Test
    @DisplayName("존재하지 않는 토큰 검증 시 null 반환")
    void testValidateNonExistentToken() {
        // when
        Long userId = approvalService.validateToken("invalid-token-12345");
        
        // then
        assertThat(userId).isNull();
        log.info("✅ 존재하지 않는 토큰 검증 통과: null 반환");
    }
    
    @Test
    @DisplayName("토큰 삭제 후 검증 시 null 반환")
    void testRemoveToken() {
        // given
        Long userId = 1L;
        String token = approvalService.generateToken(userId);
        
        // when
        approvalService.removeToken(token);
        Long validatedUserId = approvalService.validateToken(token);
        
        // then
        assertThat(validatedUserId).isNull();
        log.info("✅ 토큰 삭제 후 검증 통과: null 반환");
    }
    
    @Test
    @DisplayName("승인 링크 생성 형식 검증")
    void testGenerateApprovalLink() {
        // given
        String token = "test-token-123";
        
        // when
        String link = approvalService.generateApprovalLink(token);
        
        // then
        assertThat(link).contains("http://localhost:8080");
        assertThat(link).contains("/auth/approve");
        assertThat(link).contains("token=" + token);
        assertThat(link).isEqualTo("http://localhost:8080/auth/approve?token=" + token);
        log.info("✅ 승인 링크 형식 검증 통과: {}", link);
    }
}

