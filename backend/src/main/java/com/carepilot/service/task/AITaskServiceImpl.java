package com.carepilot.service.task;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.task.AITask;
import com.carepilot.domain.task.AITaskStatus;
import com.carepilot.domain.task.AITaskType;
import com.carepilot.domain.user.User;
import com.carepilot.dto.task.AITaskListResponseDTO;
import com.carepilot.dto.task.AITaskResponseDTO;
import com.carepilot.repository.task.AITaskRepository;
import com.carepilot.security.util.UserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

//AI 처리 내역 (AITask) 서비스 구현 - 조회 전용
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class AITaskServiceImpl implements AITaskService {

    private final AITaskRepository aiTaskRepository;
    private final UserUtil userUtil;

    private static final int RESULT_SUMMARY_MAX_LENGTH = 100; //결과 요약 최대 길이

    //AI 처리 내역 목록 조회 (필터: status, taskType)
    @Override
    public List<AITaskListResponseDTO> getAITaskList(String status, String taskType) {
        User currentUser = userUtil.getCurrentUser();
        Long orgId = currentUser.getOrganization().getOrganizationId();

        AITaskStatus statusEnum = parseAITaskStatus(status);
        AITaskType taskTypeEnum = parseAITaskType(taskType);

        List<AITask> list = aiTaskRepository.findByOrganizationAndFilters(orgId, statusEnum, taskTypeEnum);
        return list.stream().map(this::toListResponseDTO).collect(Collectors.toList());
    }

    //AI 처리 내역 상세 조회
    @Override
    public AITaskResponseDTO getAITask(Long aiTaskId) {
        AITask aiTask = getAITaskInOrg(aiTaskId);
        return toResponseDTO(aiTask);
    }

    //AI 처리 내역 조회 시 조직 검증
    private AITask getAITaskInOrg(Long aiTaskId) {
        AITask aiTask = aiTaskRepository.findByAiTaskId(aiTaskId)
                .orElseThrow(() -> new ApiException(ErrorCode.AI_TASK_NOT_FOUND));
        User currentUser = userUtil.getCurrentUser();
        if (!aiTask.getOrganization().getOrganizationId().equals(currentUser.getOrganization().getOrganizationId())) {
            throw new ApiException(ErrorCode.AI_TASK_NOT_FOUND);
        }
        return aiTask;
    }

    private static AITaskStatus parseAITaskStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return AITaskStatus.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static AITaskType parseAITaskType(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return AITaskType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    //결과 요약 생성
    private String resultSummary(String result) {
        if (result == null) return null;
        if (result.length() <= RESULT_SUMMARY_MAX_LENGTH) return result;
        return result.substring(0, RESULT_SUMMARY_MAX_LENGTH) + "...";
    }

    //AI 처리 내역 목록 응답 DTO 변환
    private AITaskListResponseDTO toListResponseDTO(AITask a) {
        a.getOrganization().getOrganizationId();
        return AITaskListResponseDTO.builder()
                .aiTaskId(a.getAiTaskId())
                .taskType(a.getTaskType() != null ? a.getTaskType().name() : null)
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .careTargetId(a.getCareTarget() != null ? a.getCareTarget().getCareTargetId() : null)
                .careTargetName(a.getCareTarget() != null ? a.getCareTarget().getName() : null)
                .resultSummary(resultSummary(a.getResult()))
                .startedAt(a.getStartedAt())
                .completedAt(a.getCompletedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }

    //AI 처리 내역 상세 응답 DTO 변환
    private AITaskResponseDTO toResponseDTO(AITask a) {
        a.getOrganization().getOrganizationId();
        if (a.getCareTarget() != null) a.getCareTarget().getName();
        return AITaskResponseDTO.builder()
                .aiTaskId(a.getAiTaskId())
                .organizationId(a.getOrganization().getOrganizationId())
                .taskType(a.getTaskType() != null ? a.getTaskType().name() : null)
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .callId(a.getCall() != null ? a.getCall().getCallId() : null)
                .scheduleId(a.getSchedule() != null ? a.getSchedule().getScheduleId() : null)
                .notificationId(a.getNotification() != null ? a.getNotification().getNotificationId() : null)
                .taskId(a.getTask() != null ? a.getTask().getTaskId() : null)
                .careTargetId(a.getCareTarget() != null ? a.getCareTarget().getCareTargetId() : null)
                .careTargetName(a.getCareTarget() != null ? a.getCareTarget().getName() : null)
                .groupId(a.getGroup() != null ? a.getGroup().getGroupId() : null)
                .result(a.getResult())
                .startedAt(a.getStartedAt())
                .completedAt(a.getCompletedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
