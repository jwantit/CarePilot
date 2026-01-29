package com.carepilot.controller;

import com.carepilot.domain.config.DoctorRole;
import com.carepilot.dto.config.DoctorDTO;
import com.carepilot.service.config.doctor.DoctorService;
import com.carepilot.util.CsvUtil;
import com.carepilot.util.RowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final CsvUtil csvUtil;

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors(@PathVariable Long organizationId) {
        return ResponseEntity.ok(doctorService.getAllDoctors(organizationId));
    }

    @GetMapping("/organization/{organizationId}/filter")
    public ResponseEntity<List<DoctorDTO>> getDoctorsByFilter(
            @PathVariable Long organizationId,
            @RequestParam(required = false) DoctorRole role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(doctorService.getDoctorsByFilter(organizationId, role, isActive, name));
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorDTO> getDoctorById(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorById(doctorId));
    }

    @PostMapping("/organization/{organizationId}")
    public ResponseEntity<DoctorDTO> createDoctor(
            @PathVariable Long organizationId,
            @RequestBody DoctorDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(doctorService.createDoctor(organizationId, dto));
    }

    // CSV/EXCEL 의료진 대량 업로드
    // 컬럼 순서: name,email,phone,specialty,role,isActive,memo
    @PostMapping(value = "/organization/{organizationId}/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<DoctorDTO>> uploadDoctorsByCsvOrExcel(
            @PathVariable Long organizationId,
            @RequestPart(value = "files") List<MultipartFile> files,
            @RequestParam(value = "isActive", required = false) Boolean defaultIsActive
    ) {
        RowMapper<DoctorDTO> mapper = cols -> {
            String roleRaw = cols[4] != null ? cols[4].trim() : "";
            DoctorRole role = roleRaw.isEmpty() ? DoctorRole.DOCTOR : DoctorRole.valueOf(roleRaw.toUpperCase());

            String activeRaw = cols[5] != null ? cols[5].trim() : "";
            Boolean isActive = activeRaw.isEmpty() ? null : Boolean.parseBoolean(activeRaw);

            return DoctorDTO.builder()
                    .name(cols[0])
                    .email(cols[1])
                    .phone(cols[2])
                    .specialty(cols[3])
                    .role(role)
                    .isActive(isActive)
                    .memo(cols[6])
                    .build();
        };

        List<DoctorDTO> parsed = csvUtil.csvOrEx(files, mapper, 7);
        List<DoctorDTO> saved = doctorService.bulkCreateDoctors(organizationId, parsed, defaultIsActive);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{doctorId}")
    public ResponseEntity<DoctorDTO> updateDoctor(
            @PathVariable Long doctorId,
            @RequestBody DoctorDTO dto) {
        return ResponseEntity.ok(doctorService.updateDoctor(doctorId, dto));
    }

    @DeleteMapping("/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long doctorId) {
        doctorService.deleteDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }
}

