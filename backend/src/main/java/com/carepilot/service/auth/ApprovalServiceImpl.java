package com.carepilot.service.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Log4j2
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {
    
    private final JavaMailSender mailSender;
    
    // TODO: 추후 Redis로 변경 (현재는 인메모리 저장)
    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();
    
    private static final int TOKEN_EXPIRY_HOURS = 24; // 24시간 유효
    
    @Value("${app.approval.base-url:http://localhost:8080}")
    private String baseUrl;
    
    @Value("${app.approval.path:/auth/approve}")
    private String approvalPath;
    
    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;
    
    @Value("${spring.mail.username:}")
    private String fromEmail;
    
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
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                // 발신자 설정
                String senderEmail = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : "noreply@carepilot.com";
                helper.setFrom(senderEmail);
                helper.setTo(managerEmail);
                helper.setSubject("[CarePilot] 직원 승인 요청");
                
                // HTML 메일 본문 작성
                String htmlContent = buildEmailContent(userName, userEmail, approvalLink);
                helper.setText(htmlContent, true);
                
                // 메일 발송
                mailSender.send(message);
                log.info("승인 요청 메일 발송 성공: managerEmail={}, userName={}, userEmail={}", 
                        managerEmail, userName, userEmail);
            } catch (MessagingException e) {
                log.error("승인 요청 메일 발송 실패: managerEmail={}, userName={}, error={}", 
                        managerEmail, userName, e.getMessage(), e);
            } catch (Exception e) {
                log.error("승인 요청 메일 발송 중 예외 발생: managerEmail={}, userName={}, error={}", 
                        managerEmail, userName, e.getMessage(), e);
            }
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
     * 이메일 본문 HTML 생성
     */
    private String buildEmailContent(String userName, String userEmail, String approvalLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Malgun Gothic', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        padding: 30px;
                        border: 1px solid #e0e0e0;
                    }
                    .header {
                        color: #14b8a6;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 4px;
                        margin: 20px 0;
                    }
                    .info-box {
                        background-color: #f0f9ff;
                        border-left: 4px solid #14b8a6;
                        padding: 15px;
                        margin: 20px 0;
                    }
                    .info-item {
                        margin: 10px 0;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #555;
                    }
                    .button {
                        display: inline-block;
                        background-color: #14b8a6;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #0d9488;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                        font-size: 12px;
                        color: #888;
                    }
                    .link {
                        word-break: break-all;
                        color: #14b8a6;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">CarePilot</div>
                    <div class="content">
                        <p>안녕하세요,</p>
                        <p>새로운 직원이 승인을 요청했습니다.</p>
                        
                        <div class="info-box">
                            <div class="info-item">
                                <span class="info-label">이름:</span> %s
                            </div>
                            <div class="info-item">
                                <span class="info-label">이메일:</span> %s
                            </div>
                        </div>
                        
                        <p>아래 버튼을 클릭하여 승인해주세요:</p>
                        <a href="%s" class="button">승인하기</a>
                        
                        <p style="margin-top: 20px;">또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
                        <p class="link">%s</p>
                        
                        <p style="color: #888; font-size: 12px; margin-top: 20px;">
                            ⚠️ 이 링크는 24시간 동안 유효합니다.
                        </p>
                    </div>
                    <div class="footer">
                        <p>이 메일은 자동으로 발송된 메일입니다. 회신하지 마세요.</p>
                        <p>&copy; 2024 CarePilot. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, userEmail, approvalLink, approvalLink);
    }
    
    //토큰 정보 저장용 내부 클래스
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

