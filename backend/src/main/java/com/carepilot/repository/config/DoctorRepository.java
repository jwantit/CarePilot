package com.carepilot.repository.config;

import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.organization.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByOrganization(Organization organization);
}


