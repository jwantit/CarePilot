package com.carepilot.repository.sms;

import com.carepilot.domain.sms.InboundSms;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InboundSmsRepository extends JpaRepository<InboundSms, Long> {

    List<InboundSms> findAllByOrderByCreatedAtDesc();

    /** 해당 업체의 케어대상에 연관된 수신 SMS만 조회 (careTarget.organization 기준) */
    List<InboundSms> findByCareTarget_Organization_OrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
