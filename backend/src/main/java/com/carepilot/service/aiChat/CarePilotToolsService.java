package com.carepilot.service.aiChat;

import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.user.User;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.caretarget.CareTargetInsertRequestDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;
import com.carepilot.dto.config.AIConfigDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.call.CallService;
import com.carepilot.service.call.CallServiceImpl;
import com.carepilot.service.caretarget.CareGroupServiceImpl;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.service.caretarget.CareServiceImpl;
import com.carepilot.service.config.ai.AiConfigService;
import com.carepilot.service.notice.NoticeServiceImpl;
import com.carepilot.service.upload.UploadFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class CarePilotToolsService {

    private final CareServiceImpl careServiceImpl;
    private final VectorIndexingService vectorIndexingService;
    private final CareGroupServiceImpl careGroupServiceImpl;
    private final CallServiceImpl callServiceImpl;
    private final UploadFileService uploadFileService;
    private final UserUtil userUtil;
    private final NoticeServiceImpl noticeServiceImpl;
    private final AiConfigService aiConfigService;
    private final TaskRepository taskRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    //환자 상세조회-----------------------------------------------------------------------
    @Tool(description = "단일 환자의 상세 정보(나이, 질환, 그룹 통화 예약 스케줄과 , 개인 통화 에약스케줄, " +
            "단일 환자(케어대상자의)위험 추이, 최근 위험도 등 전반적인 환자의 상세정보)를 조회합니다.")
    public String getCareTargetDetail(
            @ToolParam(description = "대상자id") Long careTargetId,
            @ToolParam(description = "속한 조직id") Long organizationId) {
        log.info("[조회 툴 진입 상세조회] ID: {}", organizationId);

        String careTargetDetail = vectorIndexingService.generateCareTargetFinalContent(organizationId,careTargetId);

        log.info("가져온 데이터 " + careTargetDetail);

        return careTargetDetail;
    }
    //-----------------------------------------------------------------------

    //환자 수정------------------------------------------------------------------------------
    @Tool(description = "환자(케어대상자 careTargetId)의 정보를 수정합니다. 사용자가 직접 수정을 요청한 항목만 인자에 포함하고, 나머지는 반드시 null로 두세요.")
    public String updateCareTarget(
            @ToolParam(description = "대상 식별 번호 (careTargetId). 필수 입력.") String careTargetId,
            @ToolParam(description = "수정할 성함. 명시적 요청이 없으면 null.") String name,
            @ToolParam(description = "수정할 나이 (숫자만). 명시적 요청이 없으면 null.") String age,
            @ToolParam(description = "수정할 성별 (남성/여성). 명시적 요청이 없으면 null.") String gender,
            @ToolParam(description = "수정할 연락처. 명시적 요청이 없으면 null.") String phone,
            @ToolParam(description = "수정할 주요 질환. 명시적 요청이 없으면 null.") String disease,
            @ToolParam(description = "수정할 보호자 성함. 명시적 요청이 없으면 null.") String guardianName,
            @ToolParam(description = "수정할 보호자 연락처. 명시적 요청이 없으면 null.") String guardianPhone,
            @ToolParam(description = "수정할 보호자 관계. 명시적 요청이 없으면 null.") String relationship
    ) {
        log.info("[수정 툴 진입] ID: {}", careTargetId);
        log.info("[AI 수정 요청 파라미터 확인]");
        log.info(">> ID: {}, 성함: {}, 나이: {}, 성별: {}, 연락처: {}", careTargetId, name, age, gender, phone);
        log.info(">> 질환: {}, 보호자명: {}, 보호자연락처: {}, 관계: {}", disease, guardianName, guardianPhone, relationship);

        UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long organizationId = userDTO.getOrganizationId();
        Long userId = userDTO.getUserId();

         //AI 설정 확인
        AIConfigDTO chatbotConfig = aiConfigService.getAIConfig(organizationId, "CHATBOT_AUTOMATION");
        boolean isChatbotAutomationEnabled = chatbotConfig.getIsEnabled();
        log.info("[챗봇 자동화] CHATBOT_AUTOMATION 설정: {}", isChatbotAutomationEnabled ? "ON" : "OFF");

        Long id = Long.parseLong(careTargetId.replaceAll("[^0-9]", ""));

        // 나이 파싱 (null 체크 포함)
        int parsedAge = (age != null && !age.isEmpty())
                ? Integer.parseInt(age.replaceAll("[^0-9]", ""))
                : 0;

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


        CareTarget careTarget = careServiceImpl.getCareTarget(Long.parseLong(careTargetId));

        String finalName = (name != null) ? name : careTarget.getName();
        String finalAge = (age != null) ? age : String.valueOf(careTarget.getAge());
        String finalGender = (gender != null) ? gender : careTarget.getGender();
        String finalPhone = (phone != null) ? phone : careTarget.getTargetPhone();
        String finalDisease = (disease != null) ? disease : careTarget.getDisease();
        String finalGuardianName = (guardianName != null) ? guardianName : careTarget.getGuardianName();
        String finalGuardianPhone = (guardianPhone != null) ? guardianPhone : careTarget.getGuardianPhone();
        String finalRelationship = (relationship != null) ? relationship : careTarget.getGuardianRelationship();


        String description = String.format("케어 대상 정보 수정 요청\n\n" +
                "케어 대상 ID: %s\n" +
                "수정 항목:\n" +
                "- 성함: %s\n" +
                "- 나이: %s\n" +
                "- 성별: %s\n" +
                "- 연락처: %s\n" +
                "- 질환: %s\n" +
                "- 보호자명: %s\n" +
                "- 보호자연락처: %s\n" +
                "- 보호자관계: %s",
                careTargetId, finalName, finalAge, finalGender, finalPhone, finalDisease, finalGuardianName, finalGuardianPhone, finalRelationship);

        if (!isChatbotAutomationEnabled) {
            // OFF: Task 생성 (USER, WAITING)
            createChatbotTask(organizationId, userId, TaskType.CARETARGET_UPDATE,
                    "AI 케어 대상 정보 수정 요청 확인", description, null);
            return "사용자에게 작업 페이지에서 내용을 확인하고하만 안내하고 이제 이 대화를 종료해 ";
        }

        // ON: 자동 실행
        try {
            String result = careServiceImpl.updateToolCareTarget(updateDto, id);
            
            // 자동화 성공: Task 생성 (AI, SUCCESS)
            createChatbotTask(organizationId, userId, TaskType.CARETARGET_UPDATE,
                    "AI 케어 대상 정보 수정 완료", description, result);
            
            return result;
        } catch (Exception e) {
            log.error("수정 중 오류 발생: {}", e.getMessage());
            String errorMsg = "정보 수정 중 오류가 발생했습니다: " + e.getMessage();
            
            // 자동화 실패: Task 생성 (AI, FAILED)
            createChatbotTask(organizationId, userId, TaskType.CARETARGET_UPDATE,
                    "AI 케어 대상 정보 수정 실패", description, errorMsg);
            
            return errorMsg;
        }
    }
    //------------------------------------------------------------------------------------------------

    //통화 스케줄 등록-----------------------------------------------------------------------------------------------
    @Tool(description = "통화 예약 스케줄을 최종 등록합니다. 일회성(ONE_TIME) 또는 반복(RECURRING) 예약이 가능합니다.")
    public String createCallSchedule(
            @ToolParam(description = "(필수)대상자 ID") Long careTargetId,
            @ToolParam(description = "(필수)조직 ID") Long organizationId,
            @ToolParam(description = "(필수)예약 시작 일시 (yyyy-MM-dd HH:mm)") String scheduledTime,
            @ToolParam(description = "(필수) 메모") String memo,
            @ToolParam(description = "(선택 *기본값* LOW) 우선도 (LOW, NORMAL, HIGH)") String priority,
            @ToolParam(description = "(필수)시나리오 ID") Long scenarioId,
            @ToolParam(description = "(필수)예약 유형 일회성, 반복 (ONE_TIME, RECURRING)") String type,
            @ToolParam(description = "(반복을 선택한 경우 필수)반복 주기 (DAILY, WEEKLY, MONTHLY)") String recurrence,
            @ToolParam(description = "(선택)반복 종료일 (yyyy-MM-dd HH:mm)") String recurrenceEndDate
    ) {
        UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long userId = userDTO.getUserId();

         //AI 설정 확인
        AIConfigDTO chatbotConfig = aiConfigService.getAIConfig(organizationId, "CHATBOT_AUTOMATION");
        boolean isChatbotAutomationEnabled = chatbotConfig.getIsEnabled();
        log.info("[챗봇 자동화] CHATBOT_AUTOMATION 설정: {}", isChatbotAutomationEnabled ? "ON" : "OFF");

        try {
            // 1. 입력 파라미터 전체 로그 (AI 전달값 확인)
            log.info("[예약 툴 호출] 환자: {}, 시간: {}, 유형: {}, 주기: {}, 시나리오: {}",
                    careTargetId, scheduledTime, type, recurrence, scenarioId);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            LocalDateTime startDateTime = LocalDateTime.parse(scheduledTime, formatter);

            LocalDateTime endDateTime = null;
            if (recurrenceEndDate != null && !recurrenceEndDate.isEmpty()) {
                // 종료일도 동일한 포맷으로 파싱 (yyyy-MM-dd HH:mm)
                endDateTime = LocalDateTime.parse(recurrenceEndDate, formatter);
            }

            // 2. DTO 빌드 (ScheduleType 및 Priority Enum 대응)
            ScheduleCreateRequestDTO scr = ScheduleCreateRequestDTO.builder()
                    .organizationId(organizationId)
                    .careTargetId(careTargetId)
                    .scheduledTime(startDateTime)
                    .type(type != null ? type.toUpperCase() : "ONE_TIME") // ScheduleType Enum 매핑
                    .priority(priority != null ? priority.toUpperCase() : "NORMAL") // Priority Enum 매핑
                    .recurrence(recurrence != null ? recurrence.toUpperCase() : null) // ScheduleRecurrence Enum 매핑
                    .recurrenceEndDate(endDateTime)
                    .memo(memo)
                    .scenarioId(scenarioId)
                    .build();

            if (type == null || scheduledTime == null || memo == null) {
                return "필수 예약 정보(시간, 메모)가 누락되었습니다. 다시 확인해주세요.";
            }

            // 반복인데 주기가 없는 경우 방어
            if ("RECURRING".equals(type) && recurrence == null) {
                return "반복 예약 시 반복 주기(DAILY, WEEKLY, MONTHLY)는 필수입니다.";
            }

            String description = String.format("통화 스케줄 등록 요청 (챗봇)\n\n" +
                    "환자 ID: %d\n" +
                    "예약 일시: %s\n" +
                    "예약 유형: %s\n" +
                    "메모: %s\n" +
                    "우선도: %s\n" +
                    "시나리오 ID: %d%s",
                    careTargetId, scheduledTime, type, memo, priority, scenarioId,
                    recurrence != null ? "\n반복 주기: " + recurrence : "");

            if (!isChatbotAutomationEnabled) {
                // OFF: Task 생성 (USER, WAITING)
                createChatbotTask(organizationId, userId, TaskType.SCHEDULE_CHANGE,
                        "AI 통화 스케줄 등록 요청 확인", description, null);
                return "통화 스케줄 등록 요청이 할일 목록에 추가되었습니다. 확인 후 처리해 주세요.";
            }

            // ON: 자동 실행
            // 3. 서비스 호출 전 DTO 상태 로그 (최종 검증)
            log.info("[DTO 빌드 완료] 서비스 레이어 전달 데이터: type={}, priority={}, recurrence={}",
                    scr.getType(), scr.getPriority(), scr.getRecurrence());

            Long scheduleId = callServiceImpl.createSchedule(organizationId, scr);

            // 4. 성공 메시지 반환
            String typeKo = "RECURRING".equals(scr.getType()) ? "반복" : "일회성";
            String result = String.format("%s 예약이 등록되었습니다.\n- 일시: %s\n- 메모: %s\n- 우선도: %s%s",
                    typeKo, scheduledTime, memo, priority,
                    (scr.getRecurrence() != null ? "\n- 반복 주기: " + scr.getRecurrence() : ""));

            // 자동화 성공: Task 생성 (AI, SUCCESS)
            createChatbotTask(organizationId, userId, TaskType.SCHEDULE_CHANGE,
                    "AI 통화 스케줄 등록 완료", description, result);

            return result;

        } catch (Exception e) {
            log.error("예약 등록 실패 상세 로그: ", e);
            String errorMsg = "예약 등록에 실패했습니다. 원인: " + e.getMessage();

            // 자동화 실패: Task 생성 (AI, FAILED)
            String description = String.format("통화 스케줄 등록 요청 (챗봇)\n\n" +
                    "환자 ID: %d\n" +
                    "예약 일시: %s\n" +
                    "예약 유형: %s\n" +
                    "메모: %s",
                    careTargetId, scheduledTime, type, memo);
            createChatbotTask(organizationId, userId, TaskType.SCHEDULE_CHANGE,
                    "AI 통화 스케줄 등록 실패", description, errorMsg);

            return errorMsg;
        }
    }
    //------------------------------------------------------------------------------------------------

    //시나리오 목록-----------------------------------------------------------------
    @Tool(description = "예약 등록의 마지막 단계에서 사용 가능한 통화 시나리오 목록을 조회합니다. 사용자에게 이 리스트를 보여주고 하나를 선택받아야 합니다.")
    public String triggerScenarioModal(Long organizationId) {
        List<CareGroupScenarioRequestDTO> scenarios = careGroupServiceImpl.getScenarioList(organizationId);

        if (scenarios == null || scenarios.isEmpty()) {
            return "현재 등록된 시나리오가 없습니다. 기본 통화 모드로 진행할까요?";
        }

        StringBuilder sb = new StringBuilder("현재 선택 가능한 시나리오 목록입니다. 번호나 이름을 선택해주세요:\n\n");
        for (int i = 0; i < scenarios.size(); i++) {
            CareGroupScenarioRequestDTO s = scenarios.get(i);
            sb.append(String.format("%d. %s (ID: %d)\n", i + 1, s.getScenarioName(), s.getScenarioId()));
            if (s.getScenarioDescription() != null && !s.getScenarioDescription().isEmpty()) {
                sb.append("   - 설명: ").append(s.getScenarioDescription()).append("\n");
            }
        }

        return sb.toString();
    }

    //환자 위험도 추이----------------------------------------------------------------
    @Tool(description = "모든 환자의 위험도 긴급 등 확인해야할때 예:) 환자 이름이 없이 '누가 제일 위급해?', '위험도 순위 알려줘', '가장 긴급한 환자는?'")
    public String getCareTargetRisk(
            @ToolParam(description = "현재 세션의 조직 ID -> organizationId ") Long organizationId,
            @ToolParam(description = "조회 범위") int range
    ) {
        log.info("[조회 범위] {}", range);
        log.info("[조직 Id] {}", organizationId);
        Map<String, Object> getRisk = careServiceImpl.getRiskFindAll(organizationId, range);

        log.info("[위험도 추이 성공] {}", getRisk.toString());
        return "조회 결과입니다: " + getRisk.toString();
    }
    //공지사항----------------------------------------------------------------------------------------
    @Tool(description = "공지사항 등록 하는 툴 사용자 기준")
    public String createBoard(
            @ToolParam(description = "등록하는 사용자ID userId ") Long userId,
            @ToolParam(description = "공지사항 제목") String title,
            @ToolParam(description = "공지사항 본문") String content,
            @ToolParam(description = "파일첨부 fileId") Long fileId
            ) {
        log.info(" [등록한 글 제목]  {}", title);
        log.info(" [등록한 글내용]  {}", content);
        log.info(" [사용자 id] {}", userId);
        log.info(" [file id] {}", fileId);

        UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long organizationId = userDTO.getOrganizationId();

        // AI 설정 확인
        AIConfigDTO chatbotConfig = aiConfigService.getAIConfig(organizationId, "CHATBOT_AUTOMATION");
        boolean isChatbotAutomationEnabled = chatbotConfig.getIsEnabled();
        log.info("[챗봇 자동화] CHATBOT_AUTOMATION 설정: {}", isChatbotAutomationEnabled ? "ON" : "OFF");

        String description = String.format("공지사항 작성 요청\n\n제목: %s\n본문: %s\n파일 ID: %s",
                title, content, fileId != null ? fileId.toString() : "없음");

        if (!isChatbotAutomationEnabled) {
            // OFF: Task 생성 (USER, WAITING)
            createChatbotTask(organizationId, userId, TaskType.NOTICE_CREATE,
                    "AI 공지사항 작성 요청 확인", description, null);
            return "공지사항 작성 요청이 할일 목록에 추가되었습니다. 확인 후 처리해 주세요.";
        }

        // ON: 자동 실행
        try {
            List<MultipartFile> files = new ArrayList<>();

            if (fileId != null) {
                log.info("파일삭제로직" + fileId);
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
                log.info("임시 파일 삭제 진행: ID {}", fileId);
                uploadFileService.temporaryDelFile(fileId);
            }

            String result = String.format("공지사항 '%s' 등록 완료", title);
            
            // 자동화 성공: Task 생성 (AI, SUCCESS)
            createChatbotTask(organizationId, userId, TaskType.NOTICE_CREATE,
                    "AI 공지사항 작성 완료", description, result);
            
            return String.format(
                    "최종 결과: 공지사항 '%s' 등록 완료. " +
                            "데이터베이스 저장이 완전히 끝났으므로, 더 이상 툴을 호출하거나 파일 ID를 테스트하지 말고 " +
                            "사용자에게 등록이 완료되었다고 즉시 답변하세요.", title);
        } catch (Exception e) {
            log.error("공지사항 작성 중 오류 발생: {}", e.getMessage());
            String errorMsg = "공지사항 작성 중 오류가 발생했습니다: " + e.getMessage();
            
            // 자동화 실패: Task 생성 (AI, FAILED)
            createChatbotTask(organizationId, userId, TaskType.NOTICE_CREATE,
                    "AI 공지사항 작성 실패", description, errorMsg);
            
            return errorMsg;
        }
    }

    /**
     * 챗봇 자동화 Task 생성 헬퍼 메서드
     */
    private void createChatbotTask(Long organizationId, Long userId, TaskType taskType,
                                   String title, String description, String result) {
        try {
            Organization organization = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + organizationId));
            User user = userRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            TaskSourceType sourceType;
            TaskStatus status;
            LocalDateTime completedAt = null;

            if (result == null) {
                // OFF: USER, WAITING
                sourceType = TaskSourceType.USER;
                status = TaskStatus.WAITING;
            } else if (result.contains("오류") || result.contains("실패")) {
                // 실패: AI, FAILED
                sourceType = TaskSourceType.AI;
                status = TaskStatus.FAILED;
                completedAt = LocalDateTime.now();
            } else {
                // 성공: AI, SUCCESS
                sourceType = TaskSourceType.AI;
                status = TaskStatus.SUCCESS;
                completedAt = LocalDateTime.now();
            }

            Task task = Task.builder()
                    .organization(organization)
                    .sourceType(sourceType)
                    .type(taskType)
                    .title(title)
                    .description(description)
                    .status(status)
                    .createdBy(user)
                    .assignedTo(user)
                    .priority(Priority.MEDIUM)
                    .result(result)
                    .completedAt(completedAt)
                    .startedAt(sourceType == TaskSourceType.AI ? LocalDateTime.now() : null)
                    .build();

            taskRepository.save(task);
            log.info("[챗봇 자동화] Task 생성 완료: taskId={}, type={}, sourceType={}, status={}",
                    task.getTaskId(), taskType, sourceType, status);
        } catch (Exception e) {
            log.error("[챗봇 자동화] Task 생성 실패: {}", e.getMessage(), e);
        }
    }
}