package com.carepilot.service.task;

import com.carepilot.dto.task.AITaskListResponseDTO;
import com.carepilot.dto.task.AITaskResponseDTO;

import java.util.List;

//AI 처리 내역 (AITask) 서비스 - 조회 전용
public interface AITaskService {

    //AI 처리 내역 목록 조회 (필터: status, taskType)
    List<AITaskListResponseDTO> getAITaskList(String status, String taskType);

    //AI 처리 내역 상세 조회
    AITaskResponseDTO getAITask(Long aiTaskId);
}
