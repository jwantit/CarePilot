package com.carepilot.service.caretarget;

import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.*;

import java.util.List;

public interface CareGroupService{

    //케데 그룹생성
    public List<CareGroupListResponseDTO> insertCareGroup(CareGroupRequestDTO dto, Long userId);
    //케데 그룹 리스트 조회
    public List<CareGroupListResponseDTO> getCareGroupList(Long organizationId);


    //시나리오 리스트 조회 프론트에서 선택하기 위해
    public List<CareGroupScenarioRequestDTO> getScenarioList(Long organizationId);

    //상세보기
    public CareGroupOneDetailResponseDTO getCareTargetGroupDetail(Long organizationId, Long careGroupId);

    //그룹삭제
    public void deleteGroup(Long groupId);

    //그룹수정
    public CareGroupOneDetailResponseDTO updateCareTargetGroup(CareGroupUpdateRequestDTO careGroupUpdateRequestDTO);

    //그룹내 멤버추가
    public CareGroupOneDetailResponseDTO addCareTargetInGroup(CareGroupUpdateRequestDTO careGroupUpdateRequestDTO);

    //스케줄 등록
    public List<CareGroupCallScheduleResponseDTO> saveOrUpdateCareGroupCallSchedule(CareGroupScheduleRequestDTO dto, Long userId);


    //스케줄 조회
    public List<CareGroupCallScheduleResponseDTO> getCareGroupCallScheduleList(Long groupId, Long organizationId);

    //스케줄 삭제
    public void deleteGroupCallSchedule(Long groupId,  Long scheduleId);







}
