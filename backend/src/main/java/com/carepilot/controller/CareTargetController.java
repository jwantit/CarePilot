package com.carepilot.controller;

import com.carepilot.dto.caretarget.*;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.util.CsvUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/caretarget")
public class CareTargetController {

    private final CsvUtil csvUtil;
    private final CareService careService;

    // CSV, 엑셀 대응
    @PostMapping(value = "/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CareTargetListResponseDTO>> csvCareTarget(
            @RequestPart(value = "files") List<MultipartFile> files,
            @RequestParam("organizationId") Long organizationId, // @RequestParam 명시
            @RequestParam("careStatus") Boolean careStatus // @RequestParam 명시
    ) {
        log.info("CSV 업로드 컨트롤러 진입 - 조직ID: {}", organizationId);

        List<CsvDTO> csvs = csvUtil.csvOrEx(files);
        List<CareTargetListResponseDTO> result = careService.csvOrExcelCareTargetSave(csvs, organizationId, careStatus);

        return ResponseEntity.ok(result);
    }

    // 수동 환자 등록
    @PostMapping(value = "/care/insert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CareTargetListResponseDTO>> careTargetInsert(
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @ModelAttribute CareTargetInsertRequestDTO careTargetInsertRequestDTO
    ) {

        List<CareTargetListResponseDTO> result = careService.careTargetInsert(careTargetInsertRequestDTO, files);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/care/list")
    public ResponseEntity<List<CareTargetListResponseDTO>> getTargetList(
            @RequestParam("organizationId") Long organizationId,
            @RequestParam("status") String status,
            @RequestParam(value = "keyword", required = false) String keyword
            ) {

        log.info("상태는" + status);
        List<CareTargetListResponseDTO> result = careService.getCareTargetList(organizationId, status, keyword);

        return ResponseEntity.ok(result);
    }


    @GetMapping("/care/doctor")
    public ResponseEntity<List<CareTargetDoctorResponseDTO>> getDoctorList(@RequestParam("organizationId") Long organizationId) {

        List<CareTargetDoctorResponseDTO> result = careService.getDoctorList(organizationId);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/care/detail")
    public ResponseEntity<CareTargetDetailResponseDTO> getCareTargetDetail(
            @RequestParam("careTargetId") Long careTargetId,
            @RequestParam("organizationId") Long organizationId) {

        CareTargetDetailResponseDTO result = careService.getCareTargetDetail(organizationId, careTargetId);

        return ResponseEntity.ok(result);
    }


    @PatchMapping(value = "/care/detail/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CareTargetDetailResponseDTO> updateCareTargetDetail(
            @RequestParam("organizationId") Long organizationId,
            @RequestParam("careTargetId") Long careTargetId,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @ModelAttribute CareTargetUpdateRequestDTO updateDTO // 텍스트 필드들을 담은 DTO
    ) {

        log.info("업체id",organizationId);
        log.info("케어대상자ID",careTargetId);
        log.info("파일" + file);
        log.info("케어대상자ID",updateDTO.getName());
        CareTargetDetailResponseDTO result = careService.updateCareTargetDetail(organizationId,careTargetId,updateDTO,file);


        return ResponseEntity.ok(result);
    }




}


