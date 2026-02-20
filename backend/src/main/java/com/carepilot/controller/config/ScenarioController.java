package com.carepilot.controller.config;

import com.carepilot.dto.config.scenario.ScenarioDTO;
import com.carepilot.service.config.scenario.ScenarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioService scenarioService;

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<ScenarioDTO>> getAllScenarios(@PathVariable Long organizationId) {
        return ResponseEntity.ok(scenarioService.getAllScenarios(organizationId));
    }

    @GetMapping("/organization/{organizationId}/filter")
    public ResponseEntity<List<ScenarioDTO>> getScenariosByFilter(
            @PathVariable Long organizationId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(scenarioService.getScenariosByFilter(organizationId, status, riskLevel, category));
    }

    @GetMapping("/{scenarioId}")
    public ResponseEntity<ScenarioDTO> getScenarioById(@PathVariable Long scenarioId) {
        return ResponseEntity.ok(scenarioService.getScenarioById(scenarioId));
    }

    @PostMapping("/organization/{organizationId}")
    public ResponseEntity<ScenarioDTO> createScenario(
            @PathVariable Long organizationId,
            @RequestBody ScenarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scenarioService.createScenario(organizationId, dto));
    }

    @PutMapping("/{scenarioId}")
    public ResponseEntity<ScenarioDTO> updateScenario(
            @PathVariable Long scenarioId,
            @RequestBody ScenarioDTO dto) {
        return ResponseEntity.ok(scenarioService.updateScenario(scenarioId, dto));
    }

    @DeleteMapping("/{scenarioId}")
    public ResponseEntity<Void> deleteScenario(@PathVariable Long scenarioId) {
        scenarioService.deleteScenario(scenarioId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{scenarioId}/enabled")
    public ResponseEntity<ScenarioDTO> updateScenarioEnabledStatus(
            @PathVariable Long scenarioId,
            @RequestParam Boolean enabled) {
        return ResponseEntity.ok(scenarioService.updateScenarioEnabledStatus(scenarioId, enabled));
    }
}

