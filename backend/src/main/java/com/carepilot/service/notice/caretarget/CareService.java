package com.carepilot.service.notice.caretarget;

import com.carepilot.dto.caretarget.CsvDTO;
import com.carepilot.dto.caretarget.CareRequestDTO;

import java.util.List;

public interface CareService {

    //CSV, EXCEL 을 통한 대양등록 로직---------------------------
    List<CsvDTO> csvOrExcelCareTargetSave(List<CsvDTO> csvs, Long organizationId);

    public void careTargetInsert(CareRequestDTO careRequestDTO);
}
