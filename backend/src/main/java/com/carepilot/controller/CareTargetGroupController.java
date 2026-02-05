package com.carepilot.controller;


import com.carepilot.domain.user.User;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.dto.caretarget.*;
import com.carepilot.dto.caretarget.caretargetgroup.*;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.caretarget.CareGroupService;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.util.CsvUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/caregroup")
public class CareTargetGroupController {

    private final CareGroupService careGroupService;
    private final UserUtil userUtil;

    //insert 로직----------------------------------------------------------------------------
    //케데그룹 생성 리스트------------------------------------------
    @PostMapping("/insert")
    public ResponseEntity<List<CareGroupListResponseDTO>> createCareGroup(
            @RequestBody CareGroupRequestDTO careGroupRequestDTO
    ) {
        log.info("생성 로직");
        List<CareGroupListResponseDTO> result = careGroupService.insertCareGroup(careGroupRequestDTO, careGroupRequestDTO.getUserId());

        return ResponseEntity.ok(result);
    }

    //케그 인서트시 시나리오 목록---------------------------------------------------------
    @GetMapping("/scenario/list")
    public ResponseEntity<List<CareGroupScenarioRequestDTO>> getScenarioList(
            @RequestParam("organizationId") Long organizationId
    ) {
        
        log.info("시나리오 진입");
        List<CareGroupScenarioRequestDTO> result = careGroupService.getScenarioList(organizationId);
        log.info("시나리오 조회 성공 ");
        return ResponseEntity.ok(result);
    }

    //케데그룹 조회 리스트------------------------------------------
    @GetMapping("/list")
    public ResponseEntity<List<CareGroupListResponseDTO>> getCareGroupList(
            @RequestParam("organizationId") Long organizationId
    ) {
        List<CareGroupListResponseDTO> result = careGroupService.getCareGroupList(organizationId);

        return ResponseEntity.ok(result);
    }

    //케데 그룸 상세 보기-------------------------------------
    @GetMapping("/detail")
    public ResponseEntity<CareGroupOneDetailResponseDTO> getCareGroupDetail(
            @RequestParam("organizationId") Long organizationId,
            @RequestParam("careGroupId") Long careGroupId
    ) {
        CareGroupOneDetailResponseDTO result = careGroupService.getCareTargetGroupDetail(organizationId,careGroupId);

        return ResponseEntity.ok(result);
    }
    //-----------------------------------------------------

    //그룹삭제----------------------------------------------------
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteGroup(
            @RequestParam("careGroupId") Long careGroupId
    ) {
        careGroupService.deleteGroup(careGroupId);
        return ResponseEntity.ok().build();
    }
    //-----------------------------------------------------

    //수정----------------------------------------------------
    @PostMapping("/update")
    public ResponseEntity<CareGroupOneDetailResponseDTO> updateGroup(
            @RequestBody CareGroupUpdateRequestDTO requestDTO
    ) {
        log.info("그루비룸" + requestDTO.getGroupName());
        // 서비스에서 수정 로직 수행 후, 변경된 최신 상세 정보를 반환합니다.
        CareGroupOneDetailResponseDTO result = careGroupService.updateCareTargetGroup(requestDTO);
        return ResponseEntity.ok(result);
    }
    //-----------------------------------------------------


    //추가----------------------------------------------------
    @PostMapping("/target/update")
    public ResponseEntity<CareGroupOneDetailResponseDTO> addCareTargetGroup(
            @RequestBody CareGroupUpdateRequestDTO requestDTO
    ) {
        // 서비스에서 수정 로직 수행 후, 변경된 최신 상세 정보를 반환합니다.
        CareGroupOneDetailResponseDTO result = careGroupService.addCareTargetInGroup(requestDTO);
        return ResponseEntity.ok(result);
    }
    //-----------------------------------------------------

    //그룹 스케줄 등록 / 수정----------------------------------------------------
    @PostMapping("/schedule/add")
    public ResponseEntity<List<CareGroupCallScheduleResponseDTO>> addCareTargetGroupCallSchedule(
            @RequestBody CareGroupScheduleRequestDTO requestDTO
    ) {
        UserDTO userDTO = userUtil.getCurrentUserDTO();


        log.info("예약 시작일" + requestDTO.getScheduledTime());
        log.info("RECURRING 과 같은형태 :" + requestDTO.getType());
        log.info("DAILY 과 같은형태 :" + requestDTO.getRecurrence());
        log.info("반복 종료일" + requestDTO.getRecurrenceEndDate());
        log.info("MEDIUM" + requestDTO.getPriority());
        log.info("메모" + requestDTO.getMemo());

        List<CareGroupCallScheduleResponseDTO> result = careGroupService.saveOrUpdateCareGroupCallSchedule(requestDTO, userDTO.getUserId());
        return ResponseEntity.ok(result);
    }
    //-----------------------------------------------------

    //그룹 스케줄 보기-------------------------------------
    @GetMapping("/schedule/list")
    public ResponseEntity<List<CareGroupCallScheduleResponseDTO>> getCareGroupCallScheduleList(
            @RequestParam("organizationId") Long organizationId,
            @RequestParam("careGroupId") Long careGroupId
    ) {
        List<CareGroupCallScheduleResponseDTO> result = careGroupService.getCareGroupCallScheduleList(careGroupId,organizationId);

        return ResponseEntity.ok(result);
    }
    //-----------------------------------------------------

    //그룹 스케줄----------------------------------------------------
    @DeleteMapping("/schedule/delete")
    public ResponseEntity<Void> deleteGroupSchedule(
            @RequestParam("careGroupId") Long careGroupId,
            @RequestParam("scheduleId") Long scheduleId
    ) {
        careGroupService.deleteGroupCallSchedule(careGroupId, scheduleId);
        return ResponseEntity.ok().build();
    }
    //-----------------------------------------------------

}


