package com.carepilot.controller;

import com.carepilot.domain.config.DoctorRole;
import com.carepilot.dto.config.DoctorDTO;
import com.carepilot.service.config.doctor.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

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

