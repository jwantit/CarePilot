package com.carepilot.controller.config;

import com.carepilot.dto.config.RiskConfigDTO;
import com.carepilot.service.config.risk.RiskConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/risk-config")
@RequiredArgsConstructor
public class RiskConfigController {

    private final RiskConfigService riskConfigService;

    @GetMapping("/{organizationId}")
    public ResponseEntity<RiskConfigDTO> getRiskConfig(@PathVariable Long organizationId) {
        return ResponseEntity.ok(riskConfigService.getRiskConfig(organizationId));
    }

    @PutMapping("/{organizationId}")
    public ResponseEntity<RiskConfigDTO> updateRiskConfig(
            @PathVariable Long organizationId,
            @RequestBody RiskConfigDTO dto) {
        return ResponseEntity.ok(riskConfigService.updateRiskConfig(organizationId, dto));
    }
}

