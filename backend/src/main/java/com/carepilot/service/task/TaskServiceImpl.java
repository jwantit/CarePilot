package com.carepilot.service.task;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.user.User;
import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.dto.task.TaskRequestDTO;
import com.carepilot.dto.task.TaskResponseDTO;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.UserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

//작업 목록 (Task) 서비스 구현
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CareTargetRepository careTargetRepository;
    private final UserUtil userUtil;

    private static final int RESULT_SUMMARY_MAX_LENGTH = 100;

    //작업 목록 조회 (필터: sourceType, status, priority, type, assignedToUserId)
    @Override
    @Transactional(readOnly = true)
    public List<TaskListResponseDTO> getTaskList(String sourceType, String status, String priority, String type, Long assignedToUserId) {
        User currentUser = userUtil.getCurrentUser();
        Long orgId = currentUser.getOrganization().getOrganizationId();

        TaskSourceType sourceTypeEnum = parseSourceType(sourceType);
        TaskStatus taskStatus = parseTaskStatus(status);
        Priority priorityEnum = parsePriority(priority);
        TaskType taskType = parseTaskType(type);

        // 할당자: 같은 조직 사용자만 허용 (USER 전용)
        Long assigneeFilter = null;
        if (assignedToUserId != null) {
            User assignee = userRepository.findByUserId(assignedToUserId)
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
            if (!assignee.getOrganization().getOrganizationId().equals(orgId)) {
                assigneeFilter = null;
            } else {
                assigneeFilter = assignedToUserId;
            }
        }

        List<Task> tasks = taskRepository.findByOrganizationAndFilters(orgId, sourceTypeEnum, taskStatus, priorityEnum, taskType, assigneeFilter);
        return tasks.stream().map(this::toListResponseDTO).collect(Collectors.toList());
    }

    //작업 상세 조회
    @Override
    @Transactional(readOnly = true)
    public TaskResponseDTO getTask(Long taskId) {
        Task task = getTaskInOrg(taskId);
        return toResponseDTO(task);
    }

    @Override
    public TaskResponseDTO createTask(TaskRequestDTO request) {
        User currentUser = userUtil.getCurrentUser();
        Long orgId = currentUser.getOrganization().getOrganizationId();

        CareTarget careTarget = resolveCareTarget(request.getCareTargetId(), orgId);
        User assignedTo = resolveUserInOrg(request.getAssignedToUserId(), orgId);
        TaskType taskType = parseTaskType(request.getType());
        Priority priority = parsePriority(request.getPriority());

        Task task = Task.builder()
                .organization(currentUser.getOrganization())
                .sourceType(TaskSourceType.USER)
                .careTarget(careTarget)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(taskType != null ? taskType : TaskType.OTHER)
                .priority(priority != null ? priority : Priority.MEDIUM)
                .status(TaskStatus.WAITING)
                .createdBy(currentUser)
                .assignedTo(assignedTo)
                .dueDate(request.getDueDate())
                .build();
        task = taskRepository.save(task);
        log.info("작업 생성: taskId={}, title={}", task.getTaskId(), task.getTitle());
        return toResponseDTO(task);
    }

    @Override
    public TaskResponseDTO updateTask(Long taskId, TaskRequestDTO request) {
        Task task = getTaskInOrg(taskId);
        if (task.getSourceType() != TaskSourceType.USER) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "AI 작업은 수정할 수 없습니다.");
        }
        Long orgId = task.getOrganization().getOrganizationId();

        CareTarget careTarget = request.getCareTargetId() != null
                ? resolveCareTarget(request.getCareTargetId(), orgId) : task.getCareTarget();
        User assignedTo = resolveUserInOrg(request.getAssignedToUserId(), orgId);
        TaskType taskType = parseTaskType(request.getType());
        Priority priority = parsePriority(request.getPriority());

        task.updateDetails(
                request.getTitle(),
                request.getDescription(),
                taskType,
                priority,
                careTarget,
                assignedTo,
                request.getDueDate()
        );
        taskRepository.save(task);
        log.info("작업 수정: taskId={}", taskId);
        return toResponseDTO(task);
    }

    // 작업 상태 변경 (USER 전용)
    @Override
    public void updateStatus(Long taskId, String status) {
        Task task = getTaskInOrg(taskId);
        if (task.getSourceType() != TaskSourceType.USER) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "AI 작업은 상태 변경할 수 없습니다.");
        }
        TaskStatus taskStatus = parseTaskStatus(status);
        if (taskStatus == null) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "유효하지 않은 상태값입니다.");
        }
        task.changeStatus(taskStatus);
        taskRepository.save(task);
        log.info("작업 상태 변경: taskId={}, status={}", taskId, status);
    }

    // 작업 할당 변경 (USER 전용)
    @Override
    public void updateAssign(Long taskId, Long assignedToUserId) {
        Task task = getTaskInOrg(taskId);
        if (task.getSourceType() != TaskSourceType.USER) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "AI 작업은 할당 변경할 수 없습니다.");
        }
        Long orgId = task.getOrganization().getOrganizationId();
        User assignee = assignedToUserId != null ? resolveUserInOrg(assignedToUserId, orgId) : null;
        task.assignTo(assignee);
        taskRepository.save(task);
        log.info("작업 할당 변경: taskId={}, assignedTo={}", taskId, assignedToUserId);
    }

    @Override
    public void deleteTask(Long taskId) {
        Task task = getTaskInOrg(taskId);
        if (task.getSourceType() != TaskSourceType.USER) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "AI 작업은 삭제할 수 없습니다.");
        }
        taskRepository.delete(task);
        log.info("작업 삭제: taskId={}", taskId);
    }

    //작업 조회 시 조직 검증
    private Task getTaskInOrg(Long taskId) {
        Task task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new ApiException(ErrorCode.TASK_NOT_FOUND));
        User currentUser = userUtil.getCurrentUser();
        if (!task.getOrganization().getOrganizationId().equals(currentUser.getOrganization().getOrganizationId())) {
            throw new ApiException(ErrorCode.TASK_NOT_FOUND);
        }
        return task;
    }

    // 케어 대상자 조회 시 조직 검증
    private CareTarget resolveCareTarget(Long careTargetId, Long orgId) {
        if (careTargetId == null) return null;
        CareTarget careTarget = careTargetRepository.findById(careTargetId)
                .orElseThrow(() -> new ApiException(ErrorCode.CARE_TARGET_NOT_FOUND));
        if (!careTarget.getOrganization().getOrganizationId().equals(orgId)) {
            throw new ApiException(ErrorCode.CARE_TARGET_NOT_FOUND);
        }
        return careTarget;
    }

    //사용자 조회 시 조직 검증
    private User resolveUserInOrg(Long userId, Long orgId) {
        if (userId == null) return null;
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        if (!user.getOrganization().getOrganizationId().equals(orgId)) {
            throw new ApiException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    private static TaskSourceType parseSourceType(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return TaskSourceType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static TaskStatus parseTaskStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return TaskStatus.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String resultSummary(String result) {
        if (result == null) return null;
        if (result.length() <= RESULT_SUMMARY_MAX_LENGTH) return result;
        return result.substring(0, RESULT_SUMMARY_MAX_LENGTH) + "...";
    }

    private static Priority parsePriority(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Priority.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static TaskType parseTaskType(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return TaskType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    //작업 목록 응답 DTO 변환
    private TaskListResponseDTO toListResponseDTO(Task t) {
        if (t.getOrganization() != null) t.getOrganization().getName();
        return TaskListResponseDTO.builder()
                .taskId(t.getTaskId())
                .sourceType(t.getSourceType() != null ? t.getSourceType().name() : null)
                .title(t.getTitle())
                .careTargetId(t.getCareTarget() != null ? t.getCareTarget().getCareTargetId() : null)
                .careTargetName(t.getCareTarget() != null ? t.getCareTarget().getName() : null)
                .type(t.getType() != null ? t.getType().name() : null)
                .priority(t.getPriority() != null ? t.getPriority().name() : null)
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .assignedToUserId(t.getAssignedTo() != null ? t.getAssignedTo().getUserId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getName() : null)
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .resultSummary(resultSummary(t.getResult()))
                .startedAt(t.getStartedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }

    //작업 상세 응답 DTO 변환
    private TaskResponseDTO toResponseDTO(Task t) {
        if (t.getOrganization() != null) t.getOrganization().getName();
        if (t.getCareTarget() != null) t.getCareTarget().getName();
        if (t.getCreatedBy() != null) t.getCreatedBy().getName();
        if (t.getAssignedTo() != null) t.getAssignedTo().getName();
        return TaskResponseDTO.builder()
                .taskId(t.getTaskId())
                .sourceType(t.getSourceType() != null ? t.getSourceType().name() : null)
                .organizationId(t.getOrganization().getOrganizationId())
                .careTargetId(t.getCareTarget() != null ? t.getCareTarget().getCareTargetId() : null)
                .careTargetName(t.getCareTarget() != null ? t.getCareTarget().getName() : null)
                .title(t.getTitle())
                .description(t.getDescription())
                .type(t.getType() != null ? t.getType().name() : null)
                .priority(t.getPriority() != null ? t.getPriority().name() : null)
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .createdByUserId(t.getCreatedBy() != null ? t.getCreatedBy().getUserId() : null)
                .createdByName(t.getCreatedBy() != null ? t.getCreatedBy().getName() : null)
                .assignedToUserId(t.getAssignedTo() != null ? t.getAssignedTo().getUserId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getName() : null)
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .callId(t.getCall() != null ? t.getCall().getCallId() : null)
                .scheduleId(t.getSchedule() != null ? t.getSchedule().getScheduleId() : null)
                .notificationId(t.getNotification() != null ? t.getNotification().getNotificationId() : null)
                .groupId(t.getGroup() != null ? t.getGroup().getGroupId() : null)
                .result(t.getResult())
                .startedAt(t.getStartedAt())
                .build();
    }
}
