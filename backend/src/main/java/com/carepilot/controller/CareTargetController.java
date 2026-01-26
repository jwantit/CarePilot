package com.carepilot.controller;

import com.carepilot.domain.enums.Gender;
import com.carepilot.dto.caretarget.CareTargetInsertRequestDTO;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.CareTargetDetailResponseDTO;
import com.carepilot.dto.caretarget.CareTargetUpdateRequestDTO;
import com.carepilot.dto.caretarget.CareTargetDoctorResponseDTO;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.util.CsvUtil;
import com.carepilot.util.RowMapper;
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
            @RequestParam("organizationId") Long organizationId,
            @RequestParam("careStatus") Boolean careStatus
    ) {
        log.info("CSV 업로드 컨트롤러 진입 - 조직ID: {}", organizationId);

        // CSV 컬럼 순서: 이름, 나이, 성별, 전화번호, 질환, 보호자이름, 보호자번호, 보호자관계 (8개)
        RowMapper<CareTargetInsertRequestDTO> mapper = cols -> {
            int age = safeParseInt(cols[1]);
            String gender = normalizeGender(cols[2]);

            return CareTargetInsertRequestDTO.builder()
                    .name(cols[0])
                    .age(age)
                    .gender(gender)
                    .targetPhone(cols[3])
                    .disease(cols[4])
                    .guardianName(cols[5])
                    .guardianPhone(cols[6])
                    .guardianRelationship(cols[7])
                    .organizationId(organizationId)
                    .careStatus(careStatus)
                    .doctorId(null) // CSV에는 의료진 정보 없음
                    .build();
        };

        List<CareTargetInsertRequestDTO> requests = csvUtil.csvOrEx(files, mapper, 8);
        List<CareTargetListResponseDTO> result = careService.csvOrExcelCareTargetSave(requests);

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

    // 헬퍼 메서드들 (도메인 변환 로직)
    private String normalizeGender(String gender) {
        if (gender == null || gender.trim().isEmpty()) {
            return null;
        }
        try {
            return Gender.find(gender.trim()).getKoName();
        } catch (Exception e) {
            log.warn("성별 변환 실패: {}", gender);
            return gender.trim();
        }
    }

    private int safeParseInt(String str) {
        if (str == null || str.trim().isEmpty()) return 0;
        try {
            // 25.0 처럼 소수점이 붙어오는 엑셀 숫자 대응
            String value = str.trim().split("\\.")[0];
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}