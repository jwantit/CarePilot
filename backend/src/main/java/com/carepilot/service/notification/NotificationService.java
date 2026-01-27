package com.carepilot.service.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;

import java.util.List;

public interface NotificationService {
    Notification createAndSendNotification(Long userId, NotificationType type, 
                                     String title, String description, RiskLevel severity);
    List<Notification> getNotificationsByUserId(Long userId);
    List<Notification> getUnreadNotificationsByUserId(Long userId);
    void markAsRead(Long notificationId, Long resolvedByUserId);
    long getUnreadCount(Long userId);
}


