package com.carepilot.service.config.doctor;

import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.config.DoctorRole;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.config.DoctorDTO;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.DoctorRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final OrganizationRepository organizationRepository;
    private final CareTargetRepository careTargetRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDTO> getAllDoctors(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return doctorRepository.findByOrganization(organization).stream()
                .map(this::toDoctorDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDTO> getDoctorsByFilter(Long organizationId, DoctorRole role, Boolean isActive, String name) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        List<Doctor> doctors = doctorRepository.findByOrganization(organization);

        // 필터링
        if (role != null) {
            doctors = doctors.stream()
                    .filter(d -> d.getRole() == role)
                    .collect(Collectors.toList());
        }

        if (isActive != null) {
            doctors = doctors.stream()
                    .filter(d -> d.getIsActive().equals(isActive))
                    .collect(Collectors.toList());
        }

        if (name != null && !name.trim().isEmpty()) {
            doctors = doctors.stream()
                    .filter(d -> d.getName().contains(name))
                    .collect(Collectors.toList());
        }

        return doctors.stream()
                .map(this::toDoctorDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorDTO getDoctorById(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return toDoctorDTO(doctor);
    }

    @Override
    public DoctorDTO createDoctor(Long organizationId, DoctorDTO dto) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        Doctor doctor = Doctor.builder()
                .organization(organization)
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .specialty(dto.getSpecialty())
                .role(dto.getRole())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .memo(dto.getMemo())
                .build();

        Doctor saved = doctorRepository.save(doctor);
        return toDoctorDTO(saved);
    }

    @Override
    @Transactional
    public List<DoctorDTO> bulkCreateDoctors(Long organizationId,
                                             List<DoctorDTO> dtos,
                                             Boolean defaultIsActive) {

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        boolean finalDefault = defaultIsActive != null ? defaultIsActive : true;

        List<DoctorDTO> inserted = new ArrayList<>();

        for (DoctorDTO dto : dtos) {

            int result = doctorRepository.insertIgnore(
                    dto.getEmail(),
                    dto.getName(),
                    dto.getPhone(),
                    dto.getSpecialty(),
                    dto.getMemo(),
                    (dto.getRole() != null ? dto.getRole() : DoctorRole.DOCTOR).name(),
                    dto.getIsActive() != null ? dto.getIsActive() : finalDefault,
                    organization.getOrganizationId()
            );

            if (result == 1) {
                inserted.add(dto); // 실제 저장된 것만
            }
        }

        return inserted;
    }

    @Override
    public DoctorDTO updateDoctor(Long doctorId, DoctorDTO dto) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctor.update(
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getSpecialty(),
                dto.getRole(),
                dto.getIsActive(),
                dto.getMemo()
        );

        Doctor saved = doctorRepository.save(doctor);
        return toDoctorDTO(saved);
    }

    @Override
    public void deleteDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        careTargetRepository.clearCareTargetDoctor(doctorId);
        doctorRepository.delete(doctor);
    }

    private DoctorDTO toDoctorDTO(Doctor doctor) {
        return DoctorDTO.builder()
                .doctorId(doctor.getDoctorId())
                .organizationId(doctor.getOrganization().getOrganizationId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .specialty(doctor.getSpecialty())
                .role(doctor.getRole())
                .isActive(doctor.getIsActive())
                .memo(doctor.getMemo())
                .build();
    }
}
