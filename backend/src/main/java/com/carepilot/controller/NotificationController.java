package com.carepilot.controller;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Log4j2
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    // WebSocket 메시지 수신 (기존 기능 유지)
    @MessageMapping("/notification")
    @SendTo("/topic/notifications")
    public String sendNotification(String message) {
        log.info("sendNotification: " + message);
        return message;
    }

    // 알림 목록 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    // 읽지 않은 알림 조회
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getUnreadNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    // 읽지 않은 알림 개수
    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    // 알림 읽음 처리
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long resolvedByUserId) {
        notificationService.markAsRead(notificationId, resolvedByUserId);
        return ResponseEntity.ok().build();
    }

    // 테스트용 알림 생성
    @PostMapping("/test")
    public ResponseEntity<Notification> createTestNotification(
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "OTHER") String type,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String severity) {
        RiskLevel riskLevel = null;
        if (severity != null && !severity.isEmpty()) {
            try {
                riskLevel = RiskLevel.valueOf(severity.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid severity value: {}", severity);
            }
        }
        
        Notification notification = notificationService.createAndSendNotification(
                userId,
                com.carepilot.domain.enums.NotificationType.valueOf(type),
                title,
                description,
                riskLevel
        );
        return ResponseEntity.ok(notification);
    }
}
