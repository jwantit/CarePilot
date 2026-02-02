package com.carepilot.service.callanalysis.schedule;

import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;

public interface ScheduleExtractionService {
    /**
     * 사용자의 요청사항 텍스트에서 스케줄 변경 의도를 추출합니다.
     * @param requestText 요청사항 텍스트
     * @return 추출 결과 DTO
     */
    ScheduleExtractionResultDTO extractScheduleRequest(String requestText);
}


