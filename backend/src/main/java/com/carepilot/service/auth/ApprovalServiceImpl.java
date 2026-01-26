package com.carepilot.service.auth;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Log4j2
public class ApprovalServiceImpl implements ApprovalService {
    
    // TODO: 추후 Redis로 변경 (현재는 인메모리 저장)
    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();
    
    private static final int TOKEN_EXPIRY_HOURS = 24; // 24시간 유효
    
    @Value("${app.approval.base-url:http://localhost:8080}")
    private String baseUrl;
    
    @Value("${app.approval.path:/auth/approve}")
    private String approvalPath;
    
    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;
    
    @Override
    public String generateToken(Long userId) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryTime = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);
        
        tokenStore.put(token, new TokenInfo(userId, expiryTime));
        log.debug("승인 토큰 생성: userId={}, token={}, expiryTime={}", userId, token, expiryTime);
        
        return token;
    }
    
    @Override
    public Long validateToken(String token) {
        TokenInfo tokenInfo = tokenStore.get(token);
        
        if (tokenInfo == null) {
            log.warn("존재하지 않는 승인 토큰: token={}", token);
            return null;
        }
        
        if (tokenInfo.isExpired()) {
            log.warn("만료된 승인 토큰: token={}, expiryTime={}", token, tokenInfo.getExpiryTime());
            tokenStore.remove(token);
            return null;
        }
        
        log.debug("승인 토큰 검증 성공: token={}, userId={}", token, tokenInfo.getUserId());
        return tokenInfo.getUserId();
    }
    
    @Override
    public void removeToken(String token) {
        tokenStore.remove(token);
        log.debug("승인 토큰 삭제: token={}", token);
    }
    
    @Override
    public String generateApprovalLink(String token) {
        String link = baseUrl + approvalPath + "?token=" + token;
        log.debug("승인 링크 생성: token={}, link={}", token, link);
        return link;
    }
    
    @Override
    public void sendApprovalRequestEmail(String managerEmail, String userName, String userEmail, String approvalLink) {
        if (emailEnabled) {
            // TODO: 실제 이메일 발송 구현 (Spring Mail 등)
            log.info("이메일 발송 (실제 구현 필요): to={}, subject=승인 요청, user={}", managerEmail, userName);
        } else {
            // 개발환경: 로그 출력
            log.info("=== 승인 요청 메일 (개발환경 - 로그 출력) ===");
            log.info("수신자: {}", managerEmail);
            log.info("제목: [CarePilot] 직원 승인 요청");
            log.info("내용:");
            log.info("안녕하세요,");
            log.info("");
            log.info("새로운 직원이 승인을 요청했습니다.");
            log.info("");
            log.info("요청자 정보:");
            log.info("  - 이름: {}", userName);
            log.info("  - 이메일: {}", userEmail);
            log.info("");
            log.info("아래 링크를 클릭하여 승인해주세요:");
            log.info("  {}", approvalLink);
            log.info("");
            log.info("이 링크는 24시간 동안 유효합니다.");
            log.info("========================================");
        }
    }
    
    /**
     * 토큰 정보 저장용 내부 클래스
     */
    private static class TokenInfo {
        private final Long userId;
        private final LocalDateTime expiryTime;
        
        public TokenInfo(Long userId, LocalDateTime expiryTime) {
            this.userId = userId;
            this.expiryTime = expiryTime;
        }
        
        public Long getUserId() {
            return userId;
        }
        
        public LocalDateTime getExpiryTime() {
            return expiryTime;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryTime);
        }
    }
}

