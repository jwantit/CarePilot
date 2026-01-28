package com.carepilot.controller.task;

import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.dto.task.TaskRequestDTO;
import com.carepilot.dto.task.TaskResponseDTO;
import com.carepilot.service.task.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

//작업 목록 (Task) API
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Log4j2
public class TaskController {

    private final TaskService taskService;

    //작업 목록 조회 (필터: status, priority, type, assignedToUserId)
    @GetMapping
    public ResponseEntity<List<TaskListResponseDTO>> getTaskList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long assignedToUserId) {
        log.info("GET /api/tasks 요청: status={}, priority={}, type={}, assignedToUserId={}", status, priority, type, assignedToUserId);
        return ResponseEntity.ok(taskService.getTaskList(status, priority, type, assignedToUserId));
    }

    //작업 상세 조회
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponseDTO> getTask(@PathVariable Long taskId) {
        log.info("GET /api/tasks/{} 요청", taskId);
        return ResponseEntity.ok(taskService.getTask(taskId));
    }

    //작업 생성
    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskRequestDTO request) {
        log.info("POST /api/tasks 요청: title={}", request.getTitle());
        return ResponseEntity.ok(taskService.createTask(request));
    }

    //작업 수정
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long taskId,
            @RequestBody TaskRequestDTO request) {
        log.info("PUT /api/tasks/{} 요청", taskId);
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    //작업 상태 변경 (WAITING, PROGRESS, DONE)
    @PatchMapping("/{taskId}/status")
    public ResponseEntity<Map<String, String>> updateStatus(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        log.info("PATCH /api/tasks/{}/status 요청: status={}", taskId, status);
        taskService.updateStatus(taskId, status);
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다."));
    }

    //작업 할당자 변경
    @PatchMapping("/{taskId}/assign")
    public ResponseEntity<Map<String, String>> updateAssign(
            @PathVariable Long taskId,
            @RequestBody Map<String, Long> body) {
        Long assignedToUserId = body.get("assignedToUserId");
        log.info("PATCH /api/tasks/{}/assign 요청: assignedToUserId={}", taskId, assignedToUserId);
        taskService.updateAssign(taskId, assignedToUserId);
        return ResponseEntity.ok(Map.of("message", "할당자가 변경되었습니다."));
    }

    //작업 삭제
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable Long taskId) {
        log.info("DELETE /api/tasks/{} 요청", taskId);
        taskService.deleteTask(taskId);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }
}
