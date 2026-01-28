package com.carepilot.controller.task;

import com.carepilot.dto.task.AITaskListResponseDTO;
import com.carepilot.dto.task.AITaskResponseDTO;
import com.carepilot.service.task.AITaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//AI 처리 내역 (AITask) API - 조회 전용
@RestController
@RequestMapping("/api/ai-tasks")
@RequiredArgsConstructor
@Log4j2
public class AITaskController {

    private final AITaskService aiTaskService;

    //AI 처리 내역 목록 조회 (필터: status, taskType)
    @GetMapping
    public ResponseEntity<List<AITaskListResponseDTO>> getAITaskList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String taskType) {
        log.info("GET /api/ai-tasks 요청: status={}, taskType={}", status, taskType);
        return ResponseEntity.ok(aiTaskService.getAITaskList(status, taskType));
    }

    //AI 처리 내역 상세 조회
    @GetMapping("/{aiTaskId}")
    public ResponseEntity<AITaskResponseDTO> getAITask(@PathVariable Long aiTaskId) {
        log.info("GET /api/ai-tasks/{} 요청", aiTaskId);
        return ResponseEntity.ok(aiTaskService.getAITask(aiTaskId));
    }
}
