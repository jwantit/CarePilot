package com.carepilot.repository.call;

import com.carepilot.domain.call.CallSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallScheduleRepository extends JpaRepository<CallSchedule, Long> {

}
