package com.carepilot.service.task;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.call.Call;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.user.User;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.dto.task.TaskListResponseDTO;
import com.carepilot.dto.task.TaskRequestDTO;
import com.carepilot.dto.task.TaskResponseDTO;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.sms.ScheduleChangeService;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.service.callanalysis.schedule.AutoScheduleService;
import com.carepilot.service.caretarget.CareServiceImpl;
import com.carepilot.service.notice.NoticeServiceImpl;
import com.carepilot.service.call.CallServiceImpl;
import com.carepilot.service.upload.UploadFileService;
import com.carepilot.dto.caretarget.CareTargetInsertRequestDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.security.util.UserUtil;
import org.springframework.web.multipart.MultipartFile;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
    private final ScheduleChangeService scheduleChangeService;
    private final UserUtil userUtil;
    private final AutoScheduleService autoScheduleService;
    private final CallRecordingRepository callRecordingRepository;
    private final CareServiceImpl careServiceImpl;
    private final NoticeServiceImpl noticeServiceImpl;
    private final CallServiceImpl callServiceImpl;
    private final UploadFileService uploadFileService;

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

        // AI가 감지한 Task인지 확인 (CALL, SMS, 또는 챗봇)
        boolean isCallTask = task.getCall() != null && task.getType() == TaskType.SCHEDULE_CHANGE;
        boolean isSmsTask = task.getInboundSms() != null && task.getType() == TaskType.SCHEDULE_CHANGE;
        boolean isChatbotTask = task.getCall() == null && task.getInboundSms() == null 
                && (task.getType() == TaskType.NOTICE_CREATE 
                    || task.getType() == TaskType.CARETARGET_UPDATE 
                    || (task.getType() == TaskType.SCHEDULE_CHANGE && task.getDescription() != null && task.getDescription().contains("(챗봇)")));

        // PROGRESS로 변경할 때 AI가 감지한 Task이면 자동화 함수 실행
        if (taskStatus == TaskStatus.PROGRESS && (isCallTask || isSmsTask || isChatbotTask)) {
            String taskTypeStr = isCallTask ? "CALL" : (isSmsTask ? "SMS" : "CHATBOT");
            log.info("[작업 상태 변경] AI 감지 Task 자동화 실행 시작: taskId={}, type={}", 
                    taskId, taskTypeStr);

            try {
                if (isCallTask) {
                    // ===== CALL 자동화 처리 =====
                    processCallAutomation(task, taskId);
                    
                    // CALL 자동화: 최신 스케줄 정보 연결
                    Call updatedCall = task.getCall();
                    if (updatedCall != null && updatedCall.getCallSchedule() != null) {
                        task.updateSchedule(updatedCall.getCallSchedule());
                    }
                } else if (isSmsTask) {
                    // ===== SMS 자동화 처리 =====
                    // SMS 자동화는 processScheduleChangeWithExistingTask 내부에서 이미 task.updateSchedule()을 호출하므로 여기서는 호출하지 않음
                    processSmsAutomation(task, taskId);
                } else if (isChatbotTask) {
                    // ===== 챗봇 자동화 처리 =====
                    processChatbotAutomation(task, taskId);
                }

                // 공통 처리: 자동화 성공 시 sourceType을 AI로 변경하고 SUCCESS 처리
                task.changeSourceType(TaskSourceType.AI);
                task.updateResultAndStatus(
                    TaskStatus.SUCCESS,
                    "사용자 승인에 따른 AI 자동화 처리 완료",
                    LocalDateTime.now()
                );

                taskRepository.save(task);
                log.info("[작업 상태 변경] AI 감지 Task 자동화 실행 및 SUCCESS 처리 완료: taskId={}", taskId);

            } catch (Exception e) {
                log.error("[작업 상태 변경] AI 감지 Task 자동화 실패: taskId={}, error={}", taskId, e.getMessage(), e);
                // 자동화 실패해도 상태는 FAILED만 변경하고 USER 유지하여 수동 처리가 가능하게 함
                task.changeStatusWithStart(TaskStatus.FAILED);
                taskRepository.save(task);
                throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "자동화 실행 중 오류가 발생했습니다: " + e.getMessage());
            }
        } else {
            // 일반적인 상태 변경
            task.changeStatusWithStart(taskStatus);
            taskRepository.save(task);
        }

        log.info("작업 상태 변경 완료: taskId={}, status={}", taskId, status);
    }

    /**
     * CALL 자동화 처리
     */
    private void processCallAutomation(Task task, Long taskId) {
        log.info("[CALL 자동화] 처리 시작: taskId={}, callId={}", 
                taskId, task.getCall().getCallId());

        // Task description에서 요청사항 추출
        String requestPrefix = "요청사항: ";
        int startIndex = task.getDescription().indexOf(requestPrefix);
        String requestText = "";

        if (startIndex != -1) {
            requestText = task.getDescription().substring(startIndex + requestPrefix.length()).trim();
            int endIndex = requestText.indexOf("\n추출된 요일:");
            if (endIndex != -1) {
                requestText = requestText.substring(0, endIndex).trim();
            }
        }

        // description에서 못 찾으면 transcript에서 확인
        if (requestText.isEmpty()) {
            CallRecording recording = callRecordingRepository.findByCall_CallId(task.getCall().getCallId())
                    .orElseThrow(() -> new ApiException(ErrorCode.CALL_RECORDING_NOT_FOUND));
            String transcript = recording.getTranscript();
            if (transcript != null && transcript.contains(requestPrefix)) {
                int index = transcript.lastIndexOf(requestPrefix);
                requestText = transcript.substring(index + requestPrefix.length()).trim();
            }
        }

        if (requestText.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "요청사항을 찾을 수 없어 자동화를 실행할 수 없습니다.");
        }

        // 신규 할일을 생성하는 메서드가 아닌, 스케줄 업데이트만 수행하는 메서드 호출
        autoScheduleService.processAutoScheduleUpdateOnly(task.getCall().getCallId(), requestText);
        
        log.info("[CALL 자동화] 처리 완료: taskId={}", taskId);
    }

    /**
     * SMS 자동화 처리
     */
    private void processSmsAutomation(Task task, Long taskId) {
        log.info("[SMS 자동화] 처리 시작: taskId={}, inboundSmsId={}", 
                taskId, task.getInboundSms().getInboundSmsId());

        // SMS 자동화 서비스 호출
        // 주의: processScheduleChangeWithExistingTask 내부에서 이미 task.updateSchedule()을 호출함
        scheduleChangeService.processScheduleChangeWithExistingTask(task.getInboundSms(), task);
        
        log.info("[SMS 자동화] 처리 완료: taskId={}", taskId);
    }

    /**
     * 챗봇 자동화 처리
     */
    private void processChatbotAutomation(Task task, Long taskId) {
        log.info("[챗봇 자동화] 처리 시작: taskId={}, type={}", taskId, task.getType());

        User currentUser = userUtil.getCurrentUser();
        Long organizationId = task.getOrganization().getOrganizationId();
        Long userId = currentUser.getUserId();
        String description = task.getDescription();

        try {
            if (task.getType() == TaskType.NOTICE_CREATE) {
                // 공지사항 작성
                processNoticeCreateAutomation(task, description, userId, organizationId);
            } else if (task.getType() == TaskType.CARETARGET_UPDATE) {
                // 케어 대상 수정
                processCareTargetUpdateAutomation(task, description);
            } else if (task.getType() == TaskType.SCHEDULE_CHANGE && description != null && description.contains("(챗봇)")) {
                // 통화 스케줄 등록 (챗봇)
                processScheduleCreateAutomation(task, description, organizationId);
            } else {
                throw new ApiException(ErrorCode.BAD_REQUEST, "지원하지 않는 챗봇 자동화 타입입니다.");
            }

            log.info("[챗봇 자동화] 처리 완료: taskId={}", taskId);
        } catch (Exception e) {
            log.error("[챗봇 자동화] 처리 실패: taskId={}, error={}", taskId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 공지사항 작성 자동화
     */
   private void processNoticeCreateAutomation(Task task, String description, Long userId, Long organizationId) {
    String title = extractValue(description, "제목:");

    String content = null;
    int contentStart = description.indexOf("본문:");
    if (contentStart != -1) {
        contentStart += "본문:".length();
        int contentEnd = description.indexOf("\n파일 ID:", contentStart);
        if (contentEnd == -1) {
            // "파일 ID:"가 없으면 끝까지
            contentEnd = description.length();
        }
        content = description.substring(contentStart, contentEnd).trim();
    }
    
    String fileIdStr = extractValue(description, "파일 ID:");

    if (title == null || content == null) {
        throw new ApiException(ErrorCode.BAD_REQUEST, "공지사항 제목 또는 본문을 찾을 수 없습니다.");
    }

    Long fileId = null;
    if (fileIdStr != null && !fileIdStr.equals("없음") && !fileIdStr.trim().isEmpty()) {
        try {
            fileId = Long.parseLong(fileIdStr.trim());
        } catch (NumberFormatException e) {
            log.warn("파일 ID 파싱 실패: {}", fileIdStr);
        }
    }

    List<MultipartFile> files = new ArrayList<>();
    if (fileId != null && fileId > 0) {
        MultipartFile file = uploadFileService.temporaryfind(fileId);
        if (file != null) {
            files = List.of(file);
        }
    }

    NoticeSaveRequest notice = new NoticeSaveRequest();
    notice.setTitle(title);
    notice.setContent(content);
    notice.setIsPinned(false);

    noticeServiceImpl.saveNotice(notice, userId, organizationId, files);

    if (fileId != null && fileId > 0) {
        uploadFileService.temporaryDelFile(fileId);
    }

    log.info("[챗봇 자동화] 공지사항 작성 완료: title={}", title);
}

    /**
     * 케어 대상 수정 자동화
     */
    private void processCareTargetUpdateAutomation(Task task, String description) {
        // description 파싱: "케어 대상 정보 수정 요청\n\n케어 대상 ID: %s\n수정 항목:\n- 성함: %s\n..."
        String careTargetIdStr = extractValue(description, "케어 대상 ID:");
        if (careTargetIdStr == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "케어 대상 ID를 찾을 수 없습니다.");
        }

        Long careTargetId = Long.parseLong(careTargetIdStr.replaceAll("[^0-9]", ""));

        String name = extractValue(description, "- 성함:");
        String ageStr = extractValue(description, "- 나이:");
        String gender = extractValue(description, "- 성별:");
        String phone = extractValue(description, "- 연락처:");
        String disease = extractValue(description, "- 질환:");
        String guardianName = extractValue(description, "- 보호자명:");
        String guardianPhone = extractValue(description, "- 보호자연락처:");
        String relationship = extractValue(description, "- 보호자관계:");

        int parsedAge = 0;
        if (ageStr != null && !ageStr.trim().isEmpty()) {
            try {
                parsedAge = Integer.parseInt(ageStr.replaceAll("[^0-9]", ""));
            } catch (NumberFormatException e) {
                log.warn("나이 파싱 실패: {}", ageStr);
            }
        }

        CareTargetInsertRequestDTO updateDto = CareTargetInsertRequestDTO.builder()
                .name(name)
                .age(parsedAge)
                .gender(gender)
                .targetPhone(phone)
                .disease(disease)
                .guardianName(guardianName)
                .guardianPhone(guardianPhone)
                .guardianRelationship(relationship)
                .build();

        careServiceImpl.updateToolCareTarget(updateDto, careTargetId);
        log.info("[챗봇 자동화] 케어 대상 수정 완료: careTargetId={}", careTargetId);
    }

    /**
     * 통화 스케줄 등록 자동화 (챗봇)
     */
    private void processScheduleCreateAutomation(Task task, String description, Long organizationId) {
        // description 파싱: "통화 스케줄 등록 요청 (챗봇)\n\n환자 ID: %d\n예약 일시: %s\n..."
        String careTargetIdStr = extractValue(description, "환자 ID:");
        String scheduledTimeStr = extractValue(description, "예약 일시:");
        String type = extractValue(description, "예약 유형:");
        String memo = extractValue(description, "메모:");
        String priority = extractValue(description, "우선도:");
        String scenarioIdStr = extractValue(description, "시나리오 ID:");
        String recurrence = extractValue(description, "반복 주기:");
        String recurrenceEndDateStr = extractValue(description, "반복 종료일:");

        if (careTargetIdStr == null || scheduledTimeStr == null || memo == null || scenarioIdStr == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "필수 스케줄 정보가 누락되었습니다.");
        }

        Long careTargetId = Long.parseLong(careTargetIdStr.replaceAll("[^0-9]", ""));
        Long scenarioId = Long.parseLong(scenarioIdStr.replaceAll("[^0-9]", ""));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        LocalDateTime startDateTime = LocalDateTime.parse(scheduledTimeStr.trim(), formatter);

        LocalDateTime endDateTime = null;
        if (recurrenceEndDateStr != null && !recurrenceEndDateStr.trim().isEmpty()) {
            endDateTime = LocalDateTime.parse(recurrenceEndDateStr.trim(), formatter);
        }

        ScheduleCreateRequestDTO scr = ScheduleCreateRequestDTO.builder()
                .organizationId(organizationId)
                .careTargetId(careTargetId)
                .scheduledTime(startDateTime)
                .type(type != null ? type.toUpperCase() : "ONE_TIME")
                .priority(priority != null ? priority.toUpperCase() : "NORMAL")
                .recurrence(recurrence != null ? recurrence.toUpperCase() : null)
                .recurrenceEndDate(endDateTime)
                .memo(memo)
                .scenarioId(scenarioId)
                .build();

        callServiceImpl.createSchedule(organizationId, scr);
        log.info("[챗봇 자동화] 통화 스케줄 등록 완료: careTargetId={}, scheduledTime={}", careTargetId, scheduledTimeStr);
    }

    /**
     * Description에서 값 추출 헬퍼 메서드
     */
    private String extractValue(String description, String key) {
        if (description == null || key == null) {
            return null;
        }
        int index = description.indexOf(key);
        if (index == -1) {
            return null;
        }
        int startIndex = index + key.length();
        int endIndex = description.indexOf("\n", startIndex);
        if (endIndex == -1) {
            endIndex = description.length();
        }
        String value = description.substring(startIndex, endIndex).trim();
        return value.isEmpty() ? null : value;
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

    @Override
    public void triggerScheduleChange(Long taskId) {
        Task task = getTaskInOrg(taskId);
        if (task.getSourceType() != TaskSourceType.USER) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "AI 작업은 트리거할 수 없습니다.");
        }
        if (task.getType() != TaskType.SCHEDULE_CHANGE || task.getInboundSms() == null) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "예약 변경 문자와 연결된 작업만 AI 처리를 트리거할 수 있습니다.");
        }
        scheduleChangeService.processScheduleChangeWithExistingTask(task.getInboundSms(), task);
        log.info("예약 변경 AI 트리거 완료: taskId={}", taskId);
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
                .inboundSmsId(t.getInboundSms() != null ? t.getInboundSms().getInboundSmsId() : null)
                .build();
    }
}
