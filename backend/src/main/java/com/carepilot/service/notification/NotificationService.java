package com.carepilot.service.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;

import java.util.List;

public interface NotificationService {
    Notification createAndSendNotification(Long userId, NotificationType type,
                                           String title, String description, RiskLevel severity);
    
    Notification createAndSendNotification(Long userId, NotificationType type,
                                           String title, String description, RiskLevel severity,
                                           com.carepilot.domain.call.Call call,
                                           com.carepilot.domain.caretarget.CareTarget careTarget);
    List<Notification> getNotificationsByUserId(Long userId);
    List<Notification> getUnreadNotificationsByUserId(Long userId);
    void markAsRead(Long notificationId, Long resolvedByUserId);
    long getUnreadCount(Long userId);
    
    // 조직 공유 알림 생성 (긴급 알림용)
    Notification createOrganizationNotification(Long organizationId, NotificationType type,
                                               String title, String description, RiskLevel severity,
                                               com.carepilot.domain.call.Call call,
                                               com.carepilot.domain.caretarget.CareTarget careTarget);
}


