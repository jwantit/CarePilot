package com.carepilot.service.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.caretarget.CareTarget;

import java.util.List;

public interface NotificationService {
    Notification createAndSendNotification(Long userId, NotificationType type,
                                           String title, String description, RiskLevel severity);
    
    List<Notification> getNotificationsByUserId(Long userId);
    List<Notification> getUnreadNotificationsByUserId(Long userId);
    void markAsRead(Long notificationId, Long resolvedByUserId);
    long getUnreadCount(Long userId);
    
    // 조직 공유 알림 생성 (긴급 알림용)
    Notification createOrganizationNotification(Long organizationId, NotificationType type,
                                               String title, String description, RiskLevel severity,
                                               Call call,
                                               CareTarget careTarget);

    /**
     * 통화 실패 알림 생성 (조직 공유)
     */
    Notification createCallFailureNotification(Long organizationId, Call call,
                                              CareTarget careTarget,
                                              CallStatus status);

    /**
     * 위험 감지 알림 생성 (조직 공유)
     */
    Notification createRiskDetectionNotification(Long organizationId, Call call,
                                                 CareTarget careTarget,
                                                 Integer riskScore, RiskLevel riskLevel);
}


