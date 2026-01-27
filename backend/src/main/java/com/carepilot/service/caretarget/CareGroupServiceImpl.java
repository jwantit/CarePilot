package com.carepilot.service.caretarget;


import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.caretarget.GroupType;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupScenarioRequestDTO;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetGroupRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareGroupServiceImpl implements CareGroupService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CareTargetGroupMapRepository careTargetGroupMapRepository;
    private final CareTargetGroupRepository careTargetGroupRepository;
    private final CareTargetRepository careTargetRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final ScenarioRepository scenarioRepository;

    
    
    //그룹 생성 로직-----------------------------------------------------
    @Override
    @Transactional
    public List<CareGroupListResponseDTO> insertCareGroup(CareGroupRequestDTO dto, Long userId) {


//        @Data
//        @AllArgsConstructor
//        @NoArgsConstructor
//        public class CareGroupRequestDTO {
//            private List<Long> careTargetId;
//            private Long scenarioId;
//            private Long organizationId;
//            private String groupName;
//            private String groupDescription;
//            private Boolean groupStatus;
//            private Long userId;
//        }
        Scenario scenario = scenarioRepository.findById(dto.getScenarioId())
                .orElseThrow(() -> new RuntimeException("해당 시나리오를 찾을 수 없담: " + dto.getScenarioId()));

        log.info("scenario" + scenario.getName());

        Organization organization = organizationRepository.findById(dto.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("해당 조직을 찾을 수 없습니다: " + dto.getOrganizationId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + dto.getUserId()));
        log.info("성공1");

        CareTargetGroup careTargetGroup = CareTargetGroup.builder()
                .organization(organization)
                .groupName(dto.getGroupName())
                .groupDescription(dto.getGroupDescription())
                .groupStatus(dto.getGroupStatus())
                .scenario(scenario)
                .createdBy(user)
                .build();

        CareTargetGroup ctResult = careTargetGroupRepository.save(careTargetGroup);

        log.info("케어그룹" + ctResult.getScenario().getName());

        Boolean filter = null;
        for (Long id : dto.getCareTargetId()){

            CareTarget careTarget = careTargetRepository.findCareTargetWithFilter(id, filter)
                    .orElseThrow(() -> new NoSuchElementException(
                            "대상자 ID [" + id + "]를 찾을 수 없습니다."
                    ));

            CareTargetGroupMap ct = CareTargetGroupMap.builder()
                    .group(ctResult)
                    .careTarget(careTarget)
                    .build();

            careTargetGroupMapRepository.save(ct);
        }
        return getCareGroupList(dto.getOrganizationId());
    }


    //그룹 리스트 조회
    //-----------------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CareGroupListResponseDTO> getCareGroupList(Long organizationId) {

        // 모든 매핑 데이터 조회
        List<CareTargetGroupMap> ctgms = careTargetGroupMapRepository.findAllGroupDetails(organizationId);

        Map<CareTargetGroup, List<CareTarget>> groupedByGroup = ctgms.stream()
                .collect(Collectors.groupingBy(
                        CareTargetGroupMap::getGroup,
                        LinkedHashMap::new,
                        Collectors.mapping(CareTargetGroupMap::getCareTarget, Collectors.toList())
                ));

        // Map을 DTO 리스트로 변환
        List<CareGroupListResponseDTO> groupDetails = groupedByGroup.entrySet().stream()
                .map(entry -> {
                    CareTargetGroup group = entry.getKey();
                    List<CareTarget> targets = entry.getValue();

                    // 그룹 내 환자 목록 변환
                    List<CareTargetListResponseDTO> ctlrs = new ArrayList<>();
                    for (CareTarget ct : targets) {
                        CareTargetListResponseDTO ctlr = CareTargetListResponseDTO.builder()
                                .careTargetId(ct.getCareTargetId())
                                .name(ct.getName())
                                .build();
                        ctlrs.add(ctlr);
                    }

                    return CareGroupListResponseDTO.builder()
                            .groupName(group.getGroupName())
                            .groupDescription(group.getGroupDescription())
                            .groupStatus(group.getGroupStatus() ? "활성" : "비활성")
                            .careTargetCount(String.valueOf(targets.size()))
                            .scenarioName(group.getScenario() != null ? group.getScenario().getName() : "")
                            .careList(ctlrs)
                            .build();
                }).toList();
        return groupDetails;
    }
    //-----------------------------------------------------------------------------




    //그룹 상세정보------------------------------------------------------------------
    @Override
    public CareGroupDetailResponseDTO getAllCareGroup(Long organizationId) {
        return null;
    }
    //-------------------------------------------------------------------------

    //케데 선택 리스트------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<CareTargetListResponseDTO> getCareTargetList(Long organizationId) {
        return careTargetRepository.findCareTargetList(organizationId, true);
    }
    //-------------------------------------------------------------

    //시나리오 선택 리스트 ------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CareGroupScenarioRequestDTO> getScenarioList(Long organizationId) {
        return scenarioRepository.findScenarioList(organizationId, true);
    }
    //-------------------------------------------------------------

}
