package com.carepilot.service.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
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

        // 조직별 토픽으로 브로드캐스트: /topic/org/{organizationId}
        Long orgId = organization.getOrganizationId();
        String topic = "/topic/org/" + orgId;
        messagingTemplate.convertAndSend(topic, message);
        log.info("Notification sent via WebSocket to topic: {}, userId: {}", topic, userId);

        return savedNotification;
    }

    @Override
    @Transactional
    public Notification createAndSendNotification(Long userId, NotificationType type,
                                                   String title, String description, RiskLevel severity,
                                                   com.carepilot.domain.call.Call call,
                                                   com.carepilot.domain.caretarget.CareTarget careTarget) {
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
                .careTarget(careTarget)
                .call(call)
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

        // 조직별 토픽으로 브로드캐스트: /topic/org/{organizationId}
        Long orgId = organization.getOrganizationId();
        String topic = "/topic/org/" + orgId;
        messagingTemplate.convertAndSend(topic, message);
        log.info("Notification sent via WebSocket to topic: {}, userId: {}", topic, userId);

        return savedNotification;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByUserId(Long userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Long organizationId = user.getOrganization().getOrganizationId();
        
        // 개인 알림 + 조직 공유 알림 (user가 null인 것)
        return notificationRepository.findByOrganizationIdAndUserIdOrShared(organizationId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Long organizationId = user.getOrganization().getOrganizationId();
        
        // 개인 알림 + 조직 공유 알림 중 읽지 않은 것
        return notificationRepository.findByOrganizationIdAndUserIdOrSharedAndStatus(
                organizationId, userId, NotificationStatus.ACTIVE);
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
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Long organizationId = user.getOrganization().getOrganizationId();
        
        // 개인 알림 + 조직 공유 알림 중 읽지 않은 개수
        return notificationRepository.countByOrganizationIdAndUserIdOrSharedAndStatus(
                organizationId, userId, NotificationStatus.ACTIVE);
    }

    @Override
    @Transactional
    public Notification createOrganizationNotification(Long organizationId, NotificationType type,
                                                       String title, String description, RiskLevel severity,
                                                       com.carepilot.domain.call.Call call,
                                                       com.carepilot.domain.caretarget.CareTarget careTarget) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + organizationId));
        
        // 조직 공유 알림 생성 (user = null)
        Notification notification = Notification.builder()
                .organization(organization)
                .careTarget(careTarget)
                .call(call)
                .user(null)  // 조직 공유 알림
                .type(type)
                .title(title)
                .description(description)
                .severity(severity)
                .status(NotificationStatus.ACTIVE)
                .occurredAt(LocalDateTime.now())
                .build();

        // DB에 저장
        Notification savedNotification = notificationRepository.save(notification);
        log.info("Organization notification saved: notificationId={}, organizationId={}", 
                savedNotification.getNotificationId(), organizationId);

        // WebSocket으로 조직별 브로드캐스트 전송
        Map<String, Object> message = new HashMap<>();
        message.put("id", savedNotification.getNotificationId());
        message.put("type", type.name());
        message.put("title", title);
        message.put("text", description);
        message.put("severity", severity != null ? severity.name() : null);
        message.put("occurredAt", savedNotification.getOccurredAt().toString());

        // 조직별 토픽으로 전송: /topic/org/{organizationId}
        String topic = "/topic/org/" + organizationId;
        messagingTemplate.convertAndSend(topic, message);
        log.info("Organization notification sent via WebSocket to topic: {}", topic);

        return savedNotification;
    }
}

