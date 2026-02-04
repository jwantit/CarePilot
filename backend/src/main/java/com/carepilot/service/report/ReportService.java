package com.carepilot.service.report;

import com.carepilot.dto.report.StatisticsResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {
    StatisticsResponseDTO getStatistics(Long organizationId, LocalDateTime startDate, LocalDateTime endDate,
                                        Long groupId, String disease);
    
    List<String> getDiseaseList(Long organizationId);
}
