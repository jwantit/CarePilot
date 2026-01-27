package com.carepilot.service.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.enums.ScheduleStatus;
import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public List<CallResponseDTO> getCallHistory() {
        return callRepository.findAllByOrderByStartTimeDesc().stream()
                .map(CallResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<ScheduleResponseDTO> getUpcomingSchedules() {
        // '예약됨' 상태인 스케줄만 시간순으로 조회 (사진 3 하단 리스트용)
        return callScheduleRepository.findByStatusOrderByScheduledTimeAsc(ScheduleStatus.SCHEDULED).stream()
                .map(ScheduleResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<ScheduleResponseDTO> getSchedulesByMonth(int year, int month) {
        // 해당 월의 시작일과 종료일 계산 (사진 3 캘린더용)
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);

        return callScheduleRepository.findByScheduledTimeBetween(startOfMonth, endOfMonth).stream()
                .map(ScheduleResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long createSchedule(ScheduleCreateRequestDTO dto) {
        // 1. 조직 및 대상자 유효성 검사
        Organization organization = organizationRepository.findById(dto.getOrganizationId())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        CareTarget careTarget = careTargetRepository.findById(dto.getCareTargetId())
                .orElseThrow(() -> new EntityNotFoundException("CareTarget not found"));

        // 2. DTO -> Entity 변환 (생성자 또는 빌더 활용)
        // ScheduleCreateRequestDTO에 구현된 toEntity 메서드를 호출하거나 여기서 직접 빌드합니다.
        CallSchedule schedule = dto.toEntity(organization, careTarget, null); // User 정보는 필요시 추가

        return callScheduleRepository.save(schedule).getScheduleId();
    }

    @Override
    public CallDetailResponseDTO getCallDetail(Long callId) {
        // 1. 통화 기본 정보 조회 (사진 2 상단 메타데이터용)
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call not found"));

        // 2. 녹취/STT 텍스트 조회 (사진 2 STT 미니 뷰용)
        CallRecording recording = callRecordingRepository.findByCall_CallId(callId)
                .orElse(null);

        // 3. 위험도 점수 조회 (해당 통화로 생성된 위험 지수)
        RiskScore riskScore = riskScoreRepository.findByCall_CallId(callId)
                .orElse(null);

        return CallDetailResponseDTO.of(call, recording, riskScore);
    }
}