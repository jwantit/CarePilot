package com.carepilot.service.caretarget;

import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;

import java.util.List;

public interface CareGroupService{

    //케데 그룹생성
    public List<CareGroupListResponseDTO> insertCareGroup(CareGroupRequestDTO dto, Long userId);
    //케데 리스트 조회
    public List<CareGroupListResponseDTO> getCareGroupList(Long organizationId);

    //상세보기
    public CareGroupDetailResponseDTO getAllCareGroup(Long organizationId);
}
