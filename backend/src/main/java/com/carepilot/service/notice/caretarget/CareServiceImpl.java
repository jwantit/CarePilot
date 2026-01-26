package com.carepilot.service.notice.caretarget;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.CsvDTO;
import com.carepilot.dto.caretarget.CareRequestDTO;
import com.carepilot.repository.CareRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CareServiceImpl implements CareService {

    private final CareRepository careRepository;
    private final OrganizationRepository organizationRepository;


    //대량 환자등록 ---------------------------------------------------------------------------
    @Override
    public List<CsvDTO> csvOrExcelCareTargetSave(List<CsvDTO> csvs, Long organizationId) {

        //업체 가져오기
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow();

       log.info("진입 서비스");
       //Csv에 대량 등록
        for (CsvDTO dto : csvs ){
            CareTarget ct = CareTarget.builder()
                    .organization(organization)
                    .name(dto.getName())
                    .age(dto.getAge())
                    .gender(dto.getGender())
                    .careStatus(false)
                    .targetPhone(dto.getPhone())
                    .guardianName(dto.getGuardianName())
                    .guardianPhone(dto.getGuardianPhone())
                    .guardianRelationship(dto.getGuardianRelationship())
                    .build();

            log.info("저장중");
            careRepository.save(ct);
            log.info("저장 완료");

        }
        return List.of();
    }
    //END-------------------------------------------------------------------------------------------

    //수동 환자등록----------------------------------------------------------------------------------
    @Override
    public void careTargetInsert(CareRequestDTO careRequestDTO) {

        Organization organization = organizationRepository.findById(careRequestDTO.getOrganizationId())
                .orElseThrow();

        CareTarget ct = CareTarget.builder()
                .organization(organization)
                .name(careRequestDTO.getName())
                .age(careRequestDTO.getAge())
                .gender(careRequestDTO.getGender())
                .careStatus(careRequestDTO.getCareStatus())
                .targetPhone(careRequestDTO.getTargetPhone())
                .guardianName(careRequestDTO.getGuardianName())
                .guardianPhone(careRequestDTO.getGuardianPhone())
                .guardianRelationship(careRequestDTO.getGuardianRelationship())
                .build();

        careRepository.save(ct);

    }
    //END-------------------------------------------------------------------------------------------

}
