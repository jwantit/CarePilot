package com.carepilot.service;


import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.CareRequestDTO;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.service.notice.caretarget.CareService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
public class CareTargetServiceTests {

    @Autowired
    private CareService careService;

    @Autowired
    private OrganizationRepository organizationRepository;



    @Test
    @Transactional
    @Commit
    public void testInsertCareTargetOne() {

        Organization organization = organizationRepository.findById(1L).orElseThrow();

        for (int i = 0; i <= 9; i++ ){
            CareRequestDTO careRequestDTO = CareRequestDTO.builder()
                    .name("홍길동" + i)
                    .age(60 + i + 2)
                    .gender("남성")
                    .disease("당뇨병" + i)
                    .careStatus(true)
                    .targetPhone("010-" + i + "333-0000" )
                    .guardianName("박찬욱" + i)
                    .guardianPhone("010-" + i + "444-0000")
                    .guardianRelationship("배우자")
                    .organizationId(organization.getOrganizationId())
                    .build();

            careService.careTargetInsert(careRequestDTO);

        }
    }
}
