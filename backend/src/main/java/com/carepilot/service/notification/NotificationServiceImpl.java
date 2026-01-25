package com.carepilot.service.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.enums.NotificationStatus;
import com.carepilot.domain.enums.NotificationType;
import com.carepilot.domain.enums.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.repository.NotificationRepository;
import com.carepilot.repository.OrganizationRepository;
import com.carepilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Log4j2
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Notification createAndSendNotification(Long userId, NotificationType type, 
                                                   String title, String description, RiskLevel severity) {
        // User 조회
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Organization 조회 (User의 organization 사용)
        Organization organization = user.getOrganization();
        if (organization == null) {
            throw new RuntimeException("User's organization not found");
        }
        
        Notification notification = Notification.builder()
                .organization(organization)
                .user(user)
                .type(type)
                .title(title)
                .description(description)
                .severity(severity)
                .status(NotificationStatus.ACTIVE)
                .occurredAt(LocalDateTime.now())
                .build();

        // DB에 저장
        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification saved: {}", savedNotification.getNotificationId());

        // WebSocket으로 실시간 전송
        Map<String, Object> message = new HashMap<>();
        message.put("id", savedNotification.getNotificationId());
        message.put("type", type.name());
        message.put("title", title);
        message.put("text", description);
        message.put("severity", severity != null ? severity.name() : null);
        message.put("occurredAt", savedNotification.getOccurredAt().toString());

        // 특정 사용자에게만 전송 (userId 기반)
        messagingTemplate.convertAndSend("/topic/notifications", message);
        log.info("Notification sent via WebSocket to user: {}", userId);

        return savedNotification;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByOccurredAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndStatusOrderByOccurredAtDesc(
                userId, NotificationStatus.ACTIVE);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long resolvedByUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        User resolvedBy = userRepository.findByUserId(resolvedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + resolvedByUserId));
        
        notification.markAsRead(resolvedBy);
        notificationRepository.save(notification);
        log.info("Notification {} marked as read by user {}", notificationId, resolvedByUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.ACTIVE);
    }
}

