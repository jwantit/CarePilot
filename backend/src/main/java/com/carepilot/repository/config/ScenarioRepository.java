package com.carepilot.repository.config;

import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.organization.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByOrganization(Organization organization);
}


