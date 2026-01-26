package com.carepilot.repository.config;

import com.carepilot.domain.config.RiskConfig;
import com.carepilot.domain.organization.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiskConfigRepository extends JpaRepository<RiskConfig, Long> {
    Optional<RiskConfig> findByOrganization(Organization organization);
}


