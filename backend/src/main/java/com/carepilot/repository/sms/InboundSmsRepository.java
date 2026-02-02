package com.carepilot.repository.sms;

import com.carepilot.domain.sms.InboundSms;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InboundSmsRepository extends JpaRepository<InboundSms, Long> {

    List<InboundSms> findAllByOrderByCreatedAtDesc();
}
