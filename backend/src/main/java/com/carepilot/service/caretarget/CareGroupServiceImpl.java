package com.carepilot.service.caretarget;


import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.caretarget.GroupType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetGroupRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    @Override
    @Transactional
    public List<CareGroupListResponseDTO> insertCareGroup(CareGroupRequestDTO dto, Long userId) {

        GroupType groupType = null;
        if (GroupType.DISEASE.name().equals(dto.getGroupType())){
            groupType = GroupType.DISEASE;
        } else if (GroupType.AGE.name().equals(dto.getGroupType())) {
            groupType = GroupType.AGE;
        } else if (GroupType.RISK.name().equals(dto.getGroupType())) {
            groupType = GroupType.RISK;
        } else {
            groupType = GroupType.CUSTOM;
        }

        Organization organization = organizationRepository.findById(dto.getOrganizationId())
                .orElseThrow();
        User user = userRepository.findById(userId)
                .orElseThrow();

        CareTargetGroup careTargetGroup = CareTargetGroup.builder()
                .organization(organization)
                .groupName(dto.getGroupName())
                .groupDescription(dto.getGroupDescription())
                .groupStatus(dto.getGroupStatus())
                .groupType(groupType)
                .createdBy(user)
                .build();

        CareTargetGroup ctResult = careTargetGroupRepository.save(careTargetGroup);

        for (Long id : dto.getCareTargetId()){

            CareTarget careTarget = careTargetRepository.findInactiveCareTarget(id)
                    .orElseThrow();

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
                            .groupType(group.getGroupType().getKor())
                            .careTargetCount(String.valueOf(targets.size()))
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
}
