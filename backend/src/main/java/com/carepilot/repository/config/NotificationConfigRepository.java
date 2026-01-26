package com.carepilot.repository.config;

import com.carepilot.domain.config.NotificationConfig;
import com.carepilot.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, Long> {
    Optional<NotificationConfig> findByUser(User user);
}