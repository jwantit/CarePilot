package com.carepilot.service.config.notification;

import com.carepilot.dto.config.NotificationConfigDTO;

public interface NotificationConfigService {
    NotificationConfigDTO getNotificationConfig(Long userId);
    NotificationConfigDTO updateNotificationConfig(Long userId, NotificationConfigDTO dto);
}

