package com.carepilot.repository.config;

import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.CareTargetDoctorResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByOrganization(Organization organization);


    //의료진 전체조회 업체별로
    @Query("SELECT new com.carepilot.dto.caretarget.CareTargetDoctorResponseDTO(d.doctorId, d.specialty, d.name) " + // specialty로 수정
            "FROM Doctor d " +
            "WHERE d.organization.organizationId = :organizationId " + // 만약 에러나면 .id로 수정
            "ORDER BY d.doctorId DESC")
    List<CareTargetDoctorResponseDTO> findDoctorsByOrganization(@Param("organizationId") Long organizationId);
}


