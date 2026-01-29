package com.carepilot.service.config.doctor;

import com.carepilot.domain.config.DoctorRole;
import com.carepilot.dto.config.DoctorDTO;

import java.util.List;

public interface DoctorService {
    List<DoctorDTO> getAllDoctors(Long organizationId);
    List<DoctorDTO> getDoctorsByFilter(Long organizationId, DoctorRole role, Boolean isActive, String name);
    DoctorDTO getDoctorById(Long doctorId);
    DoctorDTO createDoctor(Long organizationId, DoctorDTO dto);
    List<DoctorDTO> bulkCreateDoctors(Long organizationId, List<DoctorDTO> dtos, Boolean defaultIsActive);
    DoctorDTO updateDoctor(Long doctorId, DoctorDTO dto);
    void deleteDoctor(Long doctorId);
}

