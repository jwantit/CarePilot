package com.carepilot.repository.config;

import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByOrganization(Organization organization);



    @Query("SELECT new com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO(" +
            "s.scenarioId, s.name, s.description) " +
            "FROM Scenario s " +
            "WHERE s.organization.id = :organizationId " +
            "AND s.enabled = :enabled")
    List<CareGroupScenarioRequestDTO> findScenarioList(
            @Param("organizationId") Long organizationId,
            @Param("enabled") Boolean enabled
    );
}


