package com.carepilot.repository;

import com.carepilot.domain.caretarget.CareTarget;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CareRepository extends JpaRepository<CareTarget, Long> {


}
