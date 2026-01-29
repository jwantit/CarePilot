package com.carepilot.repository.organization;

import com.carepilot.domain.organization.Organization;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Log4j2
public class OrganizationRepositoryTests {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    public void testInsertOrganization() {
        for (int i = 0; i < 5; i++) {
            Organization org = Organization.builder()
                    .name("병원 " + (i + 1))
                    .organizationNumber("ORG-" + String.format("%03d", i + 1))
                    .build();

            Organization saved = organizationRepository.save(org);
            log.info("업체 생성: {} - {}", saved.getOrganizationNumber(), saved.getName());
        }
    }

    @Transactional
    @Test
    public void testRead() {
        String orgNumber = "ORG-001";
        Organization org = organizationRepository.findByOrganizationNumber(orgNumber)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + orgNumber));

        log.info("업체 조회: {}", org.getOrganizationNumber());
        log.info("업체명: {}", org.getName());
    }
}

