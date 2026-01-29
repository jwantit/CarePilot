package com.carepilot.controller;

import com.carepilot.dto.config.AIConfigDTO;
import com.carepilot.service.config.ai.AiConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-config")
@RequiredArgsConstructor
public class AiConfigController {

    private final AiConfigService aiConfigService;

    @GetMapping("/{organizationId}/{featureName}")
    public ResponseEntity<AIConfigDTO> getAIConfig(
            @PathVariable Long organizationId,
            @PathVariable String featureName) {
        return ResponseEntity.ok(aiConfigService.getAIConfig(organizationId, featureName));
    }

    @PutMapping("/{organizationId}/{featureName}")
    public ResponseEntity<AIConfigDTO> updateAIConfig(
            @PathVariable Long organizationId,
            @PathVariable String featureName,
            @RequestParam Boolean isEnabled) {
        return ResponseEntity.ok(aiConfigService.updateAIConfig(organizationId, featureName, isEnabled));
    }
}

