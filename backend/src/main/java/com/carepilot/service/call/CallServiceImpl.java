package com.carepilot.service.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.config.Scenario;
import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.dto.call.ScheduleUpdateRequestDTO;
import com.carepilot.dto.config.RiskConfigDTO;
import com.carepilot.dto.PageRequestDTO;
import com.carepilot.dto.PageResponseDTO;
import org.springframework.data.domain.Page;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.service.config.risk.RiskConfigService;
import com.carepilot.service.sms.ScheduleNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.organization.Organization;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Log4j2
public class CallServiceImpl implements CallService {

    private final CallRepository callRepository;
    private final CallScheduleRepository callScheduleRepository;
    private final CallRecordingRepository callRecordingRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final OrganizationRepository organizationRepository;
    private final CareTargetRepository careTargetRepository;
    private final ScenarioRepository scenarioRepository;
    private final ScheduleNotificationService scheduleNotificationService;
    private final RiskConfigService riskConfigService;

    @Override
    public List<CallResponseDTO> getCallHistory(Long organizationId) {
        List<Call> calls;
        calls = callRepository.findByOrganizationOrganizationIdOrderByStartTimeDesc(organizationId);

        if (calls.isEmpty()) {
            return Collections.emptyList();
        }

        //해당 organizationId의 RiskConfig 조회
        RiskConfigDTO riskConfig = riskConfigService.getRiskConfig(organizationId);

        return calls.stream()
                .map(call -> {
                    RiskScore riskScore = riskScoreRepository.findFirstByCall_CallIdOrderByCalculatedAtDesc(call.getCallId())
                            .orElse(null);

                    // riskScore 점수를 기반으로 riskLevel 계산
                    RiskLevel riskLevel = null;
                    if (riskScore != null && riskScore.getRiskScore() != null) {
                        riskLevel = riskConfigService.resolveLevel(riskScore.getRiskScore(), riskConfig);
                    }

                    return CallResponseDTO.from(call, riskScore, riskLevel);
                })
                .collect(Collectors.toList());
    }

    @Override
    public PageResponseDTO<CallResponseDTO> getCallHistoryWithPaging(Long organizationId, PageRequestDTO pageRequestDTO) {
        // Pageable 생성 (startTime 기준 내림차순 정렬)
        Page<Call> callPage = callRepository.findByOrganizationOrganizationIdOrderByStartTimeDesc(
                organizationId, 
                pageRequestDTO.getPageable("startTime")
        );

        if (callPage.isEmpty()) {
            return PageResponseDTO.<CallResponseDTO>withAll()
                    .pageRequestDTO(pageRequestDTO)
                    .dtoList(Collections.emptyList())
                    .total(0)
                    .build();
        }

        // 해당 organizationId의 RiskConfig 조회
        RiskConfigDTO riskConfig = riskConfigService.getRiskConfig(organizationId);

        List<CallResponseDTO> dtoList = callPage.getContent().stream()
                .map(call -> {
                    RiskScore riskScore = riskScoreRepository.findFirstByCall_CallIdOrderByCalculatedAtDesc(call.getCallId())
                            .orElse(null);

                    // riskScore 점수를 기반으로 riskLevel 계산
                    RiskLevel riskLevel = null;
                    if (riskScore != null && riskScore.getRiskScore() != null) {
                        riskLevel = riskConfigService.resolveLevel(riskScore.getRiskScore(), riskConfig);
                    }

                    return CallResponseDTO.from(call, riskScore, riskLevel);
                })
                .collect(Collectors.toList());

        return PageResponseDTO.<CallResponseDTO>withAll()
                .pageRequestDTO(pageRequestDTO)
                .dtoList(dtoList)
                .total((int) callPage.getTotalElements())
                .build();
    }

    @Override
    public List<ScheduleResponseDTO> getUpcomingSchedules(Long organizationId) {
        // 예약된 상태와 취소된 상태를 함께 조회해서 취소된 것도 보여줌
        return callScheduleRepository
                .findByOrganizationOrganizationIdAndStatusInOrderByScheduledTimeAsc(
                        organizationId,
                        Arrays.asList(ScheduleStatus.SCHEDULED, ScheduleStatus.CANCELLED))
                .stream()
                .map(ScheduleResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<ScheduleResponseDTO> getSchedulesByMonth(Long organizationId, int year, int month) {
        // 해당 월의 시작일과 종료일 계산 (사진 3 캘린더용)
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);

        return callScheduleRepository.findByOrganizationOrganizationIdAndScheduledTimeBetween(organizationId, startOfMonth, endOfMonth).stream()
                .map(ScheduleResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long createSchedule(Long organizationId, ScheduleCreateRequestDTO dto) {
        // 1. 조직 및 대상자 유효성 검사
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
        
        // organizationId 일치 확인
        if (!dto.getOrganizationId().equals(organizationId)) {
            throw new IllegalArgumentException("Organization ID mismatch");
        }

        CareTarget careTarget = careTargetRepository.findById(dto.getCareTargetId())
                .orElseThrow(() -> new EntityNotFoundException("CareTarget not found"));

        Scenario scenario = null;
        if (dto.getScenarioId() != null) {
            scenario = scenarioRepository.findById(dto.getScenarioId()).orElse(null);
        }

        // 2. DTO -> Entity 변환
        CallSchedule schedule = dto.toEntity(organization, careTarget, null, scenario);
        schedule = callScheduleRepository.save(schedule);

        // 3. 예약확인 문자 발송
        try {
            scheduleNotificationService.sendScheduleConfirmationSms(schedule);
        } catch (Exception e) {
            log.warn("예약확인 문자 발송 실패 scheduleId={}: {}", schedule.getScheduleId(), e.getMessage());
        }

        return schedule.getScheduleId();
    }

    @Override
    public CallDetailResponseDTO getCallDetail(Long organizationId, Long callId) {
        // 1. 통화 기본 정보 조회 (사진 2 상단 메타데이터용)
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call not found"));

        // 조직 검증
        if (!call.getOrganization().getOrganizationId().equals(organizationId)) {
            throw new EntityNotFoundException("Call not found for this organization");
        }

        // 2. 녹취/STT 텍스트 조회 (사진 2 STT 미니 뷰용)
        CallRecording recording = callRecordingRepository.findByCall_CallId(callId)
                .orElse(null);

        // 3. 위험도 점수 조회 (해당 통화로 생성된 위험 지수)
        RiskScore riskScore = riskScoreRepository.findFirstByCall_CallIdOrderByCalculatedAtDesc(callId)
                .orElse(null);

        // 4. 조직의 RiskConfig를 기반으로 riskLevel 계산
        RiskLevel calculatedRiskLevel = null;
        if (riskScore != null && riskScore.getRiskScore() != null) {
            RiskConfigDTO riskConfig = riskConfigService.getRiskConfig(organizationId);
            calculatedRiskLevel = riskConfigService.resolveLevel(riskScore.getRiskScore(), riskConfig);
        }

        return CallDetailResponseDTO.of(call, recording, riskScore, calculatedRiskLevel);
    }

    @Override
    @Transactional
    public void updateSchedule(Long organizationId, Long scheduleId, ScheduleUpdateRequestDTO dto) {
        CallSchedule existing = callScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        
        // 조직 검증
        if (!existing.getOrganization().getOrganizationId().equals(organizationId)) {
            throw new EntityNotFoundException("Schedule not found for this organization");
        }

        CareTarget careTarget = existing.getCareTarget();
        if (dto.getCareTargetId() != null) {
            careTarget = careTargetRepository.findById(dto.getCareTargetId())
                    .orElseThrow(() -> new EntityNotFoundException("CareTarget not found"));
        }

        ScheduleType type = dto.getType() != null ? ScheduleType.valueOf(dto.getType()) : null;
        ScheduleRecurrence recurrence = dto.getRecurrence() != null && !dto.getRecurrence().isEmpty()
                ? ScheduleRecurrence.valueOf(dto.getRecurrence())
                : null;
        Priority priority = dto.getPriority() != null ? Priority.valueOf(dto.getPriority()) : null;
        LocalDateTime recurrenceEnd = dto.getRecurrenceEndDate();

        existing.applyUpdates(
                careTarget,
                dto.getScheduledTime(),
                type,
                recurrence,
                recurrenceEnd,
                priority,
                dto.getMemo());
        if (dto.getScenarioId() != null) {
            Scenario scenario = scenarioRepository.findById(dto.getScenarioId()).orElse(null);
            existing.updateScenario(scenario);
        } else {
            existing.updateScenario(null);
        }
        if (dto.getScheduledTime() != null && existing.getStatus() == ScheduleStatus.SCHEDULED) {
            existing.rescheduleNextRunAt(dto.getScheduledTime());
        }

        callScheduleRepository.save(existing);
        try {
            scheduleNotificationService.sendScheduleConfirmationSms(existing);
        } catch (Exception e) {
            log.warn("예약확인 문자 발송 실패 scheduleId={}: {}", scheduleId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteSchedule(Long organizationId, Long scheduleId) {
        CallSchedule schedule = callScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        
        // 조직 검증
        if (!schedule.getOrganization().getOrganizationId().equals(organizationId)) {
            throw new EntityNotFoundException("Schedule not found for this organization");
        }
        
        // Soft delete: 상태를 CANCELLED로 변경
        schedule.cancel();
        callScheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public void restoreSchedule(Long organizationId, Long scheduleId) {
        CallSchedule schedule = callScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        
        // 조직 검증
        if (!schedule.getOrganization().getOrganizationId().equals(organizationId)) {
            throw new EntityNotFoundException("Schedule not found for this organization");
        }
        
        // 상태를 SCHEDULED로 복구
        schedule.restore();
        callScheduleRepository.save(schedule);
    }

    // 스케줄링 자동 콜 발신 로직
    @Override
    public void executeScheduledCall(String to, LocalDateTime scheduledTime, Long scheduleId) {
        if (to == null) {
            log.info("테스트 발신 스킵 - to=null (care_target 없음 또는 target_phone 없음), scheduleId={}", scheduleId);
            return;
        }
        log.info("테스트 발신 - scheduledTime={}, to={}, scheduleId={}", scheduledTime, to, scheduleId);
        // 추후 TwilioService.makeCall(to) 등 실제 발신 연동
    }
}