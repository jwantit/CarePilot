package com.carepilot.controller.config;

import com.carepilot.dto.config.NotificationConfigDTO;
import com.carepilot.service.config.notification.NotificationConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification-config")
@RequiredArgsConstructor
public class NotificationConfigController {

    private final NotificationConfigService notificationConfigService;

    @GetMapping("/{userId}")
    public ResponseEntity<NotificationConfigDTO> getNotificationConfig(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationConfigService.getNotificationConfig(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationConfigDTO> updateNotificationConfig(
            @PathVariable Long userId,
            @RequestBody NotificationConfigDTO dto) {
        return ResponseEntity.ok(notificationConfigService.updateNotificationConfig(userId, dto));
    }
}

