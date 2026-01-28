package com.carepilot.service.task;

import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.dto.task.TaskRequestDTO;
import com.carepilot.dto.task.TaskResponseDTO;

import java.util.List;

//작업 목록 (Task) 서비스
public interface TaskService {

    //목록 조회 (필터: 상태, 우선순위, 유형, 할당자)
    List<TaskListResponseDTO> getTaskList(String status, String priority, String type, Long assignedToUserId);

    //상세 조회
    TaskResponseDTO getTask(Long taskId);

    //생성
    TaskResponseDTO createTask(TaskRequestDTO request);

    //수정
    TaskResponseDTO updateTask(Long taskId, TaskRequestDTO request);

    //상태 변경 (대기/진행중/완료)
    void updateStatus(Long taskId, String status);

    //할당자 변경
    void updateAssign(Long taskId, Long assignedToUserId);

    //삭제
    void deleteTask(Long taskId);
}
