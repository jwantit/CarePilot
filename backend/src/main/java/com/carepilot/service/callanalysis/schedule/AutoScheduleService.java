package com.carepilot.service.callanalysis.schedule;

import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;

public interface AutoScheduleService {
    /**
     * 추출된 요청 정보를 바탕으로 해당 통화와 연결된 스케줄을 자동으로 업데이트합니다.
     * @param callId 현재 통화 ID
     * @param extractionResult 추출된 스케줄 변경 정보
     */
    void processAutoScheduleUpdate(Long callId, ScheduleExtractionResultDTO extractionResult);

    /**
     * 통화 내용에서 "요청사항: " 부분을 찾아 스케줄 자동 변경을 처리합니다.
     * @param callId 현재 통화 ID
     * @param transcript 통화 전문
     */
    void processAutoScheduleTask(Long callId, String transcript);

    /**
     * 할일 생성 없이 스케줄만 업데이트합니다. (기존 할일 컨펌용)
     * @param callId 현재 통화 ID
     * @param requestText 추출된 요청사항 텍스트
     */
    void processAutoScheduleUpdateOnly(Long callId, String requestText);
}


