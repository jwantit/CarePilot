package com.carepilot.service.config.notification;

import com.carepilot.domain.config.NotificationConfig;
import com.carepilot.domain.user.User;
import com.carepilot.dto.config.NotificationConfigDTO;
import com.carepilot.repository.config.NotificationConfigRepository;

import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationConfigServiceImpl implements NotificationConfigService {

    private final NotificationConfigRepository notificationConfigRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public NotificationConfigDTO getNotificationConfig(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        //해당 유저의 config 데이터가 없으면 orElse() 에서 메모리에서 builder만 하지말고 실제 알람 설정 데이터를 생성 (save)
        NotificationConfig config = notificationConfigRepository.findByUser(user)
                .orElseGet(() -> notificationConfigRepository.save(
                        NotificationConfig.builder()
                                .organization(user.getOrganization())
                                .user(user)
                                .smsEnabled(false)
                                .emailEnabled(false)
                                .riskDetectionEnabled(true)
                                .callFailureEnabled(true)
                                .emergencyEventEnabled(true)
                                .build()
                ));

        return NotificationConfigDTO.builder()
                .notificationConfigId(config.getNotificationConfigId())
                .userId(user.getUserId())
                .smsEnabled(config.getSmsEnabled())
                .emailEnabled(config.getEmailEnabled())
                .riskDetectionEnabled(config.getRiskDetectionEnabled())
                .callFailureEnabled(config.getCallFailureEnabled())
                .emergencyEventEnabled(config.getEmergencyEventEnabled())
                .nightRestrictionStart(config.getNightRestrictionStart())
                .nightRestrictionEnd(config.getNightRestrictionEnd())
                .build();
    }

    @Override
    public NotificationConfigDTO updateNotificationConfig(Long userId, NotificationConfigDTO dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        NotificationConfig config = notificationConfigRepository.findByUser(user)
                .orElseGet(() -> NotificationConfig.builder()
                        .organization(user.getOrganization())
                        .user(user)
                        .build());

        // 기존 엔티티 수정
        config.updateSettings(
                dto.getSmsEnabled(),
                dto.getEmailEnabled(),
                dto.getRiskDetectionEnabled(),
                dto.getCallFailureEnabled(),
                dto.getEmergencyEventEnabled(),
                dto.getNightRestrictionStart(),
                dto.getNightRestrictionEnd()
        );

        NotificationConfig saved = notificationConfigRepository.save(config);

        return NotificationConfigDTO.builder()
                .notificationConfigId(saved.getNotificationConfigId())
                .userId(saved.getUser().getUserId())
                .smsEnabled(saved.getSmsEnabled())
                .emailEnabled(saved.getEmailEnabled())
                .riskDetectionEnabled(saved.getRiskDetectionEnabled())
                .callFailureEnabled(saved.getCallFailureEnabled())
                .emergencyEventEnabled(saved.getEmergencyEventEnabled())
                .nightRestrictionStart(saved.getNightRestrictionStart())
                .nightRestrictionEnd(saved.getNightRestrictionEnd())
                .build();
    }
}
