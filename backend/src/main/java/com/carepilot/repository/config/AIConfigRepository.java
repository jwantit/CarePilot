package com.carepilot.repository.config;

import com.carepilot.domain.config.AIConfig;
import com.carepilot.domain.organization.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIConfigRepository extends JpaRepository<AIConfig, Long> {
    Optional<AIConfig> findByOrganizationAndFeatureName(Organization organization, String featureName);
}