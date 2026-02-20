package com.carepilot.repository.sms;

import com.carepilot.domain.sms.OutboundSms;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboundSmsRepository extends JpaRepository<OutboundSms, Long> {

    List<OutboundSms> findAllByOrderByCreatedAtDesc();
}
