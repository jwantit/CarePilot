// backend/src/main/java/com/carepilot/dto/config/NotificationConfigDTO.java
package com.carepilot.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationConfigDTO {
    private Long notificationConfigId;
    private Long userId;
    private Boolean smsEnabled;
    private Boolean emailEnabled;
    private Boolean riskDetectionEnabled;
    private Boolean callFailureEnabled;
    private Boolean emergencyEventEnabled;
    private LocalTime nightRestrictionStart;
    private LocalTime nightRestrictionEnd;
}