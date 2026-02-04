package com.carepilot.service.report;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.callanalysis.RiskSignal;
import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.dto.report.*;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.task.TaskRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class ReportServiceImpl implements ReportService {

    private final CallRepository callRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final CareTargetRepository careTargetRepository;
    private final CareTargetGroupMapRepository careTargetGroupMapRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public StatisticsResponseDTO getStatistics(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                               Long groupId, String disease) {
        // 이전 기간 계산 (비교용)
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        LocalDateTime previousStartDate = startDate.minusDays(daysBetween);
        LocalDateTime previousEndDate = startDate;

        // 필터 조건: 그룹 ID로 CareTarget ID 목록 가져오기
        List<Long> filteredCareTargetIds = null;
        if (groupId != null) {
            filteredCareTargetIds = careTargetGroupMapRepository.findCareTargetIdsByGroupId(groupId);
            if (filteredCareTargetIds.isEmpty()) {
                // 그룹에 속한 대상자가 없으면 빈 결과 반환
                return StatisticsResponseDTO.builder()
                        .summary(SummaryDTO.builder()
                                .totalCalls(0L)
                                .successRate(0.0)
                                .riskPatients(0L)
                                .avgRiskScore(0.0)
                                .activeNotifications(0L)
                                .completedTasks(0L)
                                .build())
                        .callStatistics(CallStatisticsDTO.builder()
                                .trend(new ArrayList<>())
                                .statusDistribution(new HashMap<>())
                                .directionDistribution(new HashMap<>())
                                .timeSlotDistribution(new HashMap<>())
                                .avgDuration(0.0)
                                .failureReasonDistribution(new HashMap<>())
                                .build())
                        .riskStatistics(RiskStatisticsDTO.builder()
                                .riskLevelDistribution(new HashMap<>())
                                .topRiskSignals(new ArrayList<>())
                                .riskScoreTrend(new ArrayList<>())
                                .avgRiskScore(0.0)
                                .build())
                        .taskStatistics(TaskStatisticsDTO.builder()
                                .statusDistribution(new HashMap<>())
                                .priorityDistribution(new HashMap<>())
                                .sourceTypeDistribution(new HashMap<>())
                                .completionRate(0.0)
                                .totalAiTasks(0L)
                                .successfulAiTasks(0L)
                                .failedAiTasks(0L)
                                .aiSuccessRate(0.0)
                                .aiTaskTypeDistribution(new HashMap<>())
                                .aiTaskStatusDistribution(new HashMap<>())
                                .build())
                        .build();
            }
        }

        // Summary 계산
        SummaryDTO summary = calculateSummary(organizationId, startDate, endDate, previousStartDate, previousEndDate,
                filteredCareTargetIds, disease);

        // 통화 통계
        CallStatisticsDTO callStatistics = calculateCallStatistics(organizationId, startDate, endDate,
                filteredCareTargetIds, disease);

        // 위험 통계
        RiskStatisticsDTO riskStatistics = calculateRiskStatistics(organizationId, startDate, endDate,
                filteredCareTargetIds, disease);

        // 작업 통계
        TaskStatisticsDTO taskStatistics = calculateTaskStatistics(organizationId, startDate, endDate,
                filteredCareTargetIds, disease);

        return StatisticsResponseDTO.builder()
                .summary(summary)
                .callStatistics(callStatistics)
                .riskStatistics(riskStatistics)
                .taskStatistics(taskStatistics)
                .build();
    }

    private SummaryDTO calculateSummary(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                       LocalDateTime previousStartDate, LocalDateTime previousEndDate,
                                       List<Long> filteredCareTargetIds, String disease) {
        // 현재 기간 통계 (필터 적용)
        Long totalCalls = callRepository.countByOrganizationIdAndDateRangeWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);
        Long successCalls = callRepository.countByOrganizationIdAndStatusAndDateRangeWithFilters(
                organizationId, CallStatus.SUCCESS, startDate, endDate, filteredCareTargetIds, disease);
        Double successRate = totalCalls > 0 ? (successCalls.doubleValue() / totalCalls.doubleValue()) * 100 : 0.0;

        // 위험 환자 수 (필터 적용)
        Long riskPatients = riskScoreRepository.countRiskPatientsWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);
        
        // 평균 위험 점수 (필터 적용)
        Double avgRiskScore = riskScoreRepository.avgRiskScoreByOrganizationIdAndDateRangeWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);
        if (avgRiskScore == null) avgRiskScore = 0.0;

        // 활성 알림 (필터 적용)
        Long activeNotifications = notificationRepository.countByOrganizationIdAndStatusAndDateRangeWithFilters(
                organizationId, NotificationStatus.ACTIVE, startDate, endDate, filteredCareTargetIds, disease);

        // 완료된 작업 (필터 적용)
        Long completedTasks = taskRepository.countCompletedTasksWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);

        // 이전 기간 통계 (비교용 - 필터 적용)
        Long prevTotalCalls = callRepository.countByOrganizationIdAndDateRangeWithFilters(
                organizationId, previousStartDate, previousEndDate, filteredCareTargetIds, disease);
        Long prevSuccessCalls = callRepository.countByOrganizationIdAndStatusAndDateRangeWithFilters(
                organizationId, CallStatus.SUCCESS, previousStartDate, previousEndDate, filteredCareTargetIds, disease);
        Double prevSuccessRate = prevTotalCalls > 0 ? (prevSuccessCalls.doubleValue() / prevTotalCalls.doubleValue()) * 100 : 0.0;

        Long prevRiskPatients = riskScoreRepository.countRiskPatientsWithFilters(
                organizationId, previousStartDate, previousEndDate, filteredCareTargetIds, disease);
        Double prevAvgRiskScore = riskScoreRepository.avgRiskScoreByOrganizationIdAndDateRangeWithFilters(
                organizationId, previousStartDate, previousEndDate, filteredCareTargetIds, disease);
        if (prevAvgRiskScore == null) prevAvgRiskScore = 0.0;

        // 변화율 계산 - Long 타입을 Double로 변환
        ChangeDTO totalCallsChange = calculateChange(prevTotalCalls.doubleValue(), totalCalls.doubleValue());
        ChangeDTO successRateChange = calculateChange(prevSuccessRate, successRate);
        ChangeDTO riskPatientsChange = calculateChange(prevRiskPatients.doubleValue(), riskPatients.doubleValue());
        ChangeDTO avgRiskScoreChange = calculateChange(prevAvgRiskScore, avgRiskScore);

        return SummaryDTO.builder()
                .totalCalls(totalCalls)
                .successRate(Math.round(successRate * 10.0) / 10.0) // 소수점 1자리
                .riskPatients(riskPatients)
                .avgRiskScore(Math.round(avgRiskScore * 10.0) / 10.0)
                .activeNotifications(activeNotifications)
                .completedTasks(completedTasks)
                .totalCallsChange(totalCallsChange)
                .successRateChange(successRateChange)
                .riskPatientsChange(riskPatientsChange)
                .avgRiskScoreChange(avgRiskScoreChange)
                .build();
    }

    private ChangeDTO calculateChange(Double previous, Double current) {
        if (previous == null || previous == 0) {
            return ChangeDTO.builder()
                    .value(current != null ? current : 0.0)
                    .type(current != null && current > 0 ? "increase" : "decrease")
                    .build();
        }
        double change = ((current - previous) / previous) * 100;
        return ChangeDTO.builder()
                .value(Math.round(Math.abs(change) * 100.0) / 100.0)
                .type(change >= 0 ? "increase" : "decrease")
                .build();
    }

    private CallStatisticsDTO calculateCallStatistics(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                                       List<Long> filteredCareTargetIds, String disease) {
        // 필터 적용된 Call 목록 가져오기
        List<Call> filteredCalls = callRepository.findByOrganizationIdAndDateRangeWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);
        
        // 일별 추이 (메모리에서 계산)
        Map<LocalDate, List<Call>> callsByDate = filteredCalls.stream()
                .collect(Collectors.groupingBy(call -> call.getStartTime().toLocalDate()));
        
        List<TrendDataDTO> trend = callsByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Call> dayCalls = entry.getValue();
                    Long total = (long) dayCalls.size();
                    Long success = dayCalls.stream()
                            .filter(c -> c.getStatus() == CallStatus.SUCCESS)
                            .count();
                    Long failed = dayCalls.stream()
                            .filter(c -> c.getStatus() == CallStatus.FAILED)
                            .count();
                    Long noAnswer = dayCalls.stream()
                            .filter(c -> c.getStatus() == CallStatus.NO_ANSWER)
                            .count();
                    return TrendDataDTO.builder()
                            .date(date)
                            .total(total)
                            .success(success)
                            .failed(failed)
                            .noAnswer(noAnswer)
                            .build();
                })
                .collect(Collectors.toList());

        // 상태별 분포 (메모리에서 계산)
        Map<String, Long> statusDistribution = filteredCalls.stream()
                .collect(Collectors.groupingBy(
                        call -> call.getStatus() != null ? call.getStatus().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 방향별 분포 (메모리에서 계산)
        Map<String, Long> directionDistribution = filteredCalls.stream()
                .collect(Collectors.groupingBy(
                        call -> call.getDirection() != null ? call.getDirection().toString() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 시간대별 분포 (메모리에서 계산)
        Map<Integer, Long> timeSlotDistribution = filteredCalls.stream()
                .filter(call -> call.getStartTime() != null)
                .collect(Collectors.groupingBy(
                        call -> call.getStartTime().getHour(),
                        Collectors.counting()
                ));

        // 평균 통화 시간 (메모리에서 계산)
        Double avgDuration = filteredCalls.stream()
                .filter(call -> call.getStatus() == CallStatus.SUCCESS && call.getDuration() != null)
                .mapToInt(Call::getDuration)
                .average()
                .orElse(0.0);

        // 실패 원인별 분포 (SUCCESS가 아닌 통화만)
        Map<String, Long> failureReasonDistribution = filteredCalls.stream()
                .filter(call -> call.getStatus() != null && call.getStatus() != CallStatus.SUCCESS)
                .collect(Collectors.groupingBy(
                        call -> {
                            CallStatus status = call.getStatus();
                            if (status == CallStatus.FAILED) return "실패";
                            if (status == CallStatus.NO_ANSWER) return "무응답";
                            if (status == CallStatus.CANCELLED) return "취소됨";
                            return "기타";
                        },
                        Collectors.counting()
                ));

        return CallStatisticsDTO.builder()
                .trend(trend)
                .statusDistribution(statusDistribution)
                .directionDistribution(directionDistribution)
                .timeSlotDistribution(timeSlotDistribution)
                .avgDuration(Math.round(avgDuration * 10.0) / 10.0)
                .failureReasonDistribution(failureReasonDistribution)
                .build();
    }

    private RiskStatisticsDTO calculateRiskStatistics(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                                       List<Long> filteredCareTargetIds, String disease) {
        // 위험 레벨별 분포 (필터 적용 - 메모리에서 계산)
        List<com.carepilot.domain.call.RiskScore> riskScores = riskScoreRepository.findAll().stream()
                .filter(rs -> rs.getOrganization().getOrganizationId().equals(organizationId))
                .filter(rs -> rs.getCalculatedAt() != null && 
                        rs.getCalculatedAt().isAfter(startDate) && rs.getCalculatedAt().isBefore(endDate))
                .filter(rs -> rs.getRiskLevel() != null)
                .filter(rs -> filteredCareTargetIds == null || 
                        filteredCareTargetIds.contains(rs.getCareTarget().getCareTargetId()))
                .filter(rs -> disease == null || disease.isEmpty() || 
                        disease.equals(rs.getCareTarget().getDisease()))
                .collect(Collectors.toList());
        
        Map<String, Long> riskLevelDistribution = riskScores.stream()
                .collect(Collectors.groupingBy(
                        rs -> rs.getRiskLevel().name(),
                        Collectors.counting()
                ));

        // 위험 시그널 분석 (Call의 signals 필드에서 추출)
        List<Call> calls = callRepository.findByOrganizationIdAndDateRangeWithFilters(
                organizationId, startDate, endDate, filteredCareTargetIds, disease);
        Map<String, Long> signalCountMap = new HashMap<>();
        
        for (Call call : calls) {
            if (call.getSignals() != null && !call.getSignals().isEmpty()) {
                try {
                    List<Map<String, Object>> signals = objectMapper.readValue(
                            call.getSignals(),
                            new TypeReference<List<Map<String, Object>>>() {}
                    );
                    for (Map<String, Object> signal : signals) {
                        String signalName = (String) signal.get("signal");
                        if (signalName != null) {
                            signalCountMap.put(signalName, signalCountMap.getOrDefault(signalName, 0L) + 1);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse signals for call {}: {}", call.getCallId(), e.getMessage());
                }
            }
        }

        // Top 10 위험 시그널
        List<RiskSignalCountDTO> topRiskSignals = signalCountMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    String signalName = entry.getKey();
                    String labelKr = getSignalLabelKr(signalName);
                    return RiskSignalCountDTO.builder()
                            .signal(signalName)
                            .labelKr(labelKr)
                            .count(entry.getValue())
                            .build();
                })
                .collect(Collectors.toList());

        // 위험 점수 추이 (메모리에서 계산)
        Map<LocalDate, List<com.carepilot.domain.call.RiskScore>> riskScoresByDate = riskScores.stream()
                .filter(rs -> rs.getRiskScore() != null)
                .collect(Collectors.groupingBy(rs -> rs.getCalculatedAt().toLocalDate()));
        
        List<RiskScoreTrendDTO> riskScoreTrend = riskScoresByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    Double avgScore = entry.getValue().stream()
                            .mapToDouble(rs -> rs.getRiskScore())
                            .average()
                            .orElse(0.0);
                    return RiskScoreTrendDTO.builder()
                            .date(date)
                            .avgRiskScore(Math.round(avgScore * 10.0) / 10.0)
                            .build();
                })
                .collect(Collectors.toList());

        // 평균 위험 점수 (이미 위에서 계산됨)
        Double avgRiskScore = riskScores.stream()
                .filter(rs -> rs.getRiskScore() != null)
                .mapToDouble(rs -> rs.getRiskScore())
                .average()
                .orElse(0.0);

        return RiskStatisticsDTO.builder()
                .riskLevelDistribution(riskLevelDistribution)
                .topRiskSignals(topRiskSignals)
                .riskScoreTrend(riskScoreTrend)
                .avgRiskScore(Math.round(avgRiskScore * 10.0) / 10.0)
                .build();
    }

    private String getSignalLabelKr(String signalName) {
        try {
            RiskSignal signal = RiskSignal.valueOf(signalName);
            return signal.getLabelKr();
        } catch (IllegalArgumentException e) {
            return signalName;
        }
    }

    private TaskStatisticsDTO calculateTaskStatistics(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                                       List<Long> filteredCareTargetIds, String disease) {
        // 필터 적용된 Task 목록 가져오기
        List<com.carepilot.domain.task.Task> allTasks = taskRepository.findAll().stream()
                .filter(t -> t.getOrganization().getOrganizationId().equals(organizationId))
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(startDate) && t.getCreatedAt().isBefore(endDate))
                .filter(t -> filteredCareTargetIds == null || 
                        (t.getCareTarget() != null && filteredCareTargetIds.contains(t.getCareTarget().getCareTargetId())))
                .filter(t -> disease == null || disease.isEmpty() || 
                        (t.getCareTarget() != null && disease.equals(t.getCareTarget().getDisease())))
                .collect(Collectors.toList());
        
        // 상태별 분포 (메모리에서 계산)
        Map<String, Long> statusDistribution = allTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getStatus() != null ? task.getStatus().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 우선순위별 분포 (메모리에서 계산)
        Map<String, Long> priorityDistribution = allTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getPriority() != null ? task.getPriority().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 소스 타입별 분포 (메모리에서 계산)
        Map<String, Long> sourceTypeDistribution = allTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getSourceType() != null ? task.getSourceType().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 완료율
        Long totalTasks = (long) allTasks.size();
        Long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == com.carepilot.domain.task.TaskStatus.DONE)
                .count();
        Double completionRate = totalTasks > 0 ? (completedTasks.doubleValue() / totalTasks.doubleValue()) * 100 : 0.0;

        // AI 작업 전용 통계
        List<com.carepilot.domain.task.Task> aiTasks = allTasks.stream()
                .filter(t -> t.getSourceType() == com.carepilot.domain.task.TaskSourceType.AI)
                .collect(Collectors.toList());
        
        Long totalAiTasks = (long) aiTasks.size();
        Long successfulAiTasks = aiTasks.stream()
                .filter(t -> t.getStatus() == com.carepilot.domain.task.TaskStatus.SUCCESS)
                .count();
        Long failedAiTasks = aiTasks.stream()
                .filter(t -> t.getStatus() == com.carepilot.domain.task.TaskStatus.FAILED)
                .count();
        
        Double aiSuccessRate = totalAiTasks > 0 
                ? (successfulAiTasks.doubleValue() / totalAiTasks.doubleValue()) * 100 
                : 0.0;
        
        // AI 작업 타입별 분포
        Map<String, Long> aiTaskTypeDistribution = aiTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getType() != null ? task.getType().name() : "UNKNOWN",
                        Collectors.counting()
                ));
        
        // AI 작업 상태별 분포
        Map<String, Long> aiTaskStatusDistribution = aiTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getStatus() != null ? task.getStatus().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        return TaskStatisticsDTO.builder()
                .statusDistribution(statusDistribution)
                .priorityDistribution(priorityDistribution)
                .sourceTypeDistribution(sourceTypeDistribution)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .totalAiTasks(totalAiTasks)
                .successfulAiTasks(successfulAiTasks)
                .failedAiTasks(failedAiTasks)
                .aiSuccessRate(Math.round(aiSuccessRate * 10.0) / 10.0)
                .aiTaskTypeDistribution(aiTaskTypeDistribution)
                .aiTaskStatusDistribution(aiTaskStatusDistribution)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<String> getDiseaseList(Long organizationId) {
        return careTargetRepository.findDistinctDiseases(organizationId);
    }
}

