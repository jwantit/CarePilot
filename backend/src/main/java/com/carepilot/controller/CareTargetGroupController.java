package com.carepilot.controller;


import com.carepilot.domain.user.User;
import com.carepilot.dto.caretarget.*;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;
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
    //케데 인서트시 대상자 목록---------------------------------------------------------
    @GetMapping("/target/list")
    public ResponseEntity<List<CareTargetListResponseDTO>> getCareTargetList(
            @RequestParam("organizationId") Long organizationId
    ) {
        List<CareTargetListResponseDTO> result = careGroupService.getCareTargetList(organizationId);

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
    //insert end----------------------------------------------------------------------------














    //케데그룹 조회 리스트------------------------------------------
    @GetMapping("/list")
    public ResponseEntity<List<CareGroupListResponseDTO>> getCareGroupList(
            @RequestParam("organizationId") Long organizationId
    ) {
        List<CareGroupListResponseDTO> result = careGroupService.getCareGroupList(organizationId);

        return ResponseEntity.ok(result);
    }





}


