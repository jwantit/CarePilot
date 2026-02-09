package com.carepilot.service.auth;

public interface ApprovalService {
    
    /**
     * 승인 토큰 생성
     * @param userId 승인 대상 사용자 ID
     * @return 생성된 토큰
     */
    String generateToken(Long userId);
    
    /**
     * 토큰 검증 및 사용자 ID 반환
     * @param token 검증할 토큰
     * @return 사용자 ID (유효한 경우), null (만료 또는 존재하지 않음)
     */
    Long validateToken(String token);
    
    /**
     * 토큰 삭제 (승인 완료 후)
     * @param token 삭제할 토큰
     */
    void removeToken(String token);
    
    /**
     * 승인 링크 생성
     * @param token 승인 토큰
     * @return 완전한 승인 링크 URL
     */
    String generateApprovalLink(String token);
    
    /**
     * 승인 요청 메일 발송
     * @param managerEmail MANAGER 이메일
     * @param userName 승인 요청한 사용자 이름
     * @param userEmail 승인 요청한 사용자 이메일
     * @param approvalLink 승인 링크
     */
    void sendApprovalRequestEmail(String managerEmail, String userName, String userEmail, String approvalLink);

    /**
     * 승인 요청 통합 알림 발송 (비동기)
     * 이메일 발송 및 WebSocket 알림을 포함
     * @param userId 승인 요청한 사용자 ID
     */
    void sendApprovalNotificationsAsync(Long userId);
}

