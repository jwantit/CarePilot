package com.carepilot.controller.report;

import com.carepilot.dto.auth.UserDTO;
import com.carepilot.dto.report.StatisticsResponseDTO;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Log4j2
public class ReportController {

    private final ReportService reportService;
    private final UserUtil userUtil;
    
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponseDTO> getStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String disease) {
        
        UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long organizationId = userDTO.getOrganizationId();

        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        // 기본값: 이번 달
        if (startDate == null || startDate.isEmpty() || endDate == null || endDate.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            startDateTime = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endDateTime = now.plusMonths(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        } else {
            try {
                // URL 인코딩된 공백(%20 또는 +)을 공백으로 변환
                String normalizedStartDate = startDate.replace("+", " ").replace("%20", " ");
                String normalizedEndDate = endDate.replace("+", " ").replace("%20", " ");
                
                startDateTime = LocalDateTime.parse(normalizedStartDate, DATE_TIME_FORMATTER);
                endDateTime = LocalDateTime.parse(normalizedEndDate, DATE_TIME_FORMATTER);
            } catch (Exception e) {
                log.warn("날짜 파싱 실패: startDate={}, endDate={}, error={}", startDate, endDate, e.getMessage());
                // 파싱 실패 시 기본값 사용
                LocalDateTime now = LocalDateTime.now();
                startDateTime = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                endDateTime = now.plusMonths(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            }
        }

        StatisticsResponseDTO statistics = reportService.getStatistics(organizationId, startDateTime, endDateTime, groupId, disease);
        return ResponseEntity.ok(statistics);
    }
    
    @GetMapping("/diseases")
    public ResponseEntity<List<String>> getDiseaseList() {
        UserDTO userDTO = userUtil.getCurrentUserDTO();
        Long organizationId = userDTO.getOrganizationId();
        List<String> diseases = reportService.getDiseaseList(organizationId);
        return ResponseEntity.ok(diseases);
    }
}

