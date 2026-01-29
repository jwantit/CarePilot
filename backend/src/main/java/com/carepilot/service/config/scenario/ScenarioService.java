package com.carepilot.service.config.scenario;

import com.carepilot.dto.config.scenario.ScenarioDTO;

import java.util.List;

public interface ScenarioService {
    List<ScenarioDTO> getAllScenarios(Long organizationId);
    List<ScenarioDTO> getScenariosByFilter(Long organizationId, String status, String riskLevel, String category);
    ScenarioDTO getScenarioById(Long scenarioId);
    ScenarioDTO createScenario(Long organizationId, ScenarioDTO dto);
    ScenarioDTO updateScenario(Long scenarioId, ScenarioDTO dto);
    void deleteScenario(Long scenarioId);
    ScenarioDTO updateScenarioEnabledStatus(Long scenarioId, Boolean enabled);
}

