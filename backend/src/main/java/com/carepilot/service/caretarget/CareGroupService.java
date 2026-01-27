package com.carepilot.service.caretarget;

import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;

import java.util.List;

public interface CareGroupService{

    //케데 그룹생성
    public List<CareGroupListResponseDTO> insertCareGroup(CareGroupRequestDTO dto, Long userId);
    //케데 그룹 리스트 조회
    public List<CareGroupListResponseDTO> getCareGroupList(Long organizationId);

    //상세보기
    public CareGroupDetailResponseDTO getAllCareGroup(Long organizationId);

    //케데 멤버 리스트 조회 프론트에서 선택하기 위해
    public List<CareTargetListResponseDTO> getCareTargetList(Long organizationId);

    //시나리오 리스트 조회 프론트에서 선택하기 위해
    public List<CareGroupScenarioRequestDTO> getScenarioList(Long organizationId);
}
