package com.carepilot.service.aiChat;

import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.caretarget.CareTargetInsertRequestDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.service.call.CallService;
import com.carepilot.service.call.CallServiceImpl;
import com.carepilot.service.caretarget.CareGroupServiceImpl;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.service.caretarget.CareServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    //환자 상세조회-----------------------------------------------------------------------
    @Tool(description = "특정 환자의 상세 정보(나이, 질환, 그룹 통화 예약 스케줄과 , 개인 통화 에약스케줄, 특정 환자(케어대상자의)위험 추이 등 전반적인 환자의 상세정보)를 조회합니다.")
    public String getCareTargetDetail(
            @ToolParam(description = "대상자id") Long careTargetId,
            @ToolParam(description = "속한 조직id") Long organizationId) {
        log.info("🚀 [조회 툴 진입 상세조회] ID: {}", organizationId);

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
        log.info("🚀 [수정 툴 진입] ID: {}", careTargetId);
        log.info("🔍 [AI 수정 요청 파라미터 확인]");
        log.info(">> ID: {}, 성함: {}, 나이: {}, 성별: {}, 연락처: {}", careTargetId, name, age, gender, phone);
        log.info(">> 질환: {}, 보호자명: {}, 보호자연락처: {}, 관계: {}", disease, guardianName, guardianPhone, relationship);

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

        try {
            return careServiceImpl.updateToolCareTarget(updateDto, id);
        } catch (Exception e) {
            log.error("수정 중 오류 발생: {}", e.getMessage());
            return "정보 수정 중 오류가 발생했습니다: " + e.getMessage();
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
        try {
            // 1. 입력 파라미터 전체 로그 (AI 전달값 확인)
            log.info("📅 [예약 툴 호출] 환자: {}, 시간: {}, 유형: {}, 주기: {}, 시나리오: {}",
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

            // 3. 서비스 호출 전 DTO 상태 로그 (최종 검증)
            log.info("🚀 [DTO 빌드 완료] 서비스 레이어 전달 데이터: type={}, priority={}, recurrence={}",
                    scr.getType(), scr.getPriority(), scr.getRecurrence());

            Long scheduleId = callServiceImpl.createSchedule(organizationId, scr);

            // 4. 성공 메시지 반환
            String typeKo = "RECURRING".equals(scr.getType()) ? "반복" : "일회성";
            return String.format("✅ %s 예약이 등록되었습니다.\n- 일시: %s\n- 메모: %s\n- 우선도: %s%s",
                    typeKo, scheduledTime, memo, priority,
                    (scr.getRecurrence() != null ? "\n- 반복 주기: " + scr.getRecurrence() : ""));

        } catch (Exception e) {
            log.error("예약 등록 실패 상세 로그: ", e);
            return "예약 등록에 실패했습니다. 원인: " + e.getMessage();
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
    @Tool(description = "현재 가장 위험한 환자는 누구인가 (특정환자를 지목하지 않은 경우)")
    public String getCareTargetRisk(
            @ToolParam(description = "조직ID organizationId: ") Long organizationId
    ) {
        log.info("🚀 [예약 수정 툴 진입] ScheduleID: {}", organizationId);
        return "";
    }


}