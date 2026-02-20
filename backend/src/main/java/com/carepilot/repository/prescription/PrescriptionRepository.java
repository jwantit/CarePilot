package com.carepilot.repository.prescription;

import com.carepilot.domain.prescription.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByCareTarget_CareTargetIdOrderByAnalyzedAtDesc(Long careTargetId);
}
