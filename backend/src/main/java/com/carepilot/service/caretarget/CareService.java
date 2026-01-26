package com.carepilot.service.caretarget;

import com.carepilot.dto.caretarget.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CareService {

    //CSV, EXCEL 을 통한 대량등록 로직---------------------------
    List<CareTargetListResponseDTO> csvOrExcelCareTargetSave(List<CareTargetInsertRequestDTO> requests);

    List<CareTargetListResponseDTO> careTargetInsert(CareTargetInsertRequestDTO careTargetInsertRequestDTO, List<MultipartFile> files);

    List<CareTargetListResponseDTO> getCareTargetList(Long organizationId, String careStatus, String keyword);

    List<CareTargetDoctorResponseDTO> getDoctorList(Long organizationId);

    //케어 대상자 상세조회
    CareTargetDetailResponseDTO getCareTargetDetail(Long organizationId, Long careTargetId);

    CareTargetDetailResponseDTO updateCareTargetDetail(Long organizationId, Long careTargetId, CareTargetUpdateRequestDTO updateDTO, MultipartFile file);
}