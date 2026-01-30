package com.carepilot.service.caretarget;


import com.carepilot.domain.call.*;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.caretarget.GroupType;
import com.carepilot.domain.config.Scenario;

import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.*;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetGroupRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.upload.UploadFileService;
import jakarta.persistence.EntityNotFoundException;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final UploadFileService uploadFileService;
    private final CallRepository callRepository;
    private final CallScheduleRepository callScheduleRepository;

    
    
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

        for (Long id : dto.getCareTargetId()){

            CareTarget careTarget = careTargetRepository.findCareTargetWithFilter(id)
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
        List<CareTargetGroupMap> ctgms = careTargetGroupMapRepository.findAllGroupList(organizationId);

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
                            .groupId(group.getGroupId())
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
        return careTargetRepository.findCareTargetList(organizationId);
    }
    //-------------------------------------------------------------

    //시나리오 선택 리스트 ------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CareGroupScenarioRequestDTO> getScenarioList(Long organizationId) {
        return scenarioRepository.findScenarioList(organizationId,true);
    }
    //-------------------------------------------------------------



    //케데그룹 상세보기--------------------------------------------------------------
    @Override
    public CareGroupOneDetailResponseDTO getCareTargetGroupDetail(Long organizationId, Long careGroupId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 그룹 상세 정보 및 매핑된 환자들 조회
        List<CareTargetGroupMap> ctgms = careTargetGroupMapRepository.findGroupDetails(organizationId, careGroupId);

        if (ctgms.isEmpty()) {
            throw new EntityNotFoundException("해당 그룹 정보가 존재하지 않습니다.");
        }

        // 공통 그룹 정보 추출
        CareTargetGroup group = ctgms.get(0).getGroup();

        //위험도 카운트
        int low = 0, medium = 0, high = 0, critical = 0;

        // 환자 리스트 변환 및 위험도 카운팅
        List<CareTargetListResponseDTO> careList = new ArrayList<>();

        for (CareTargetGroupMap map : ctgms) {
            CareTarget ct = map.getCareTarget();

            // 최신 위험도 점수 및 레벨
            RiskLevel riskLevel = riskScoreRepository.findLatestByCareTargetId(ct.getCareTargetId())
                    .map(RiskScore::getRiskLevel)
                    .orElse(RiskLevel.LOW);

            // 위험도 카운트 증가
            switch (riskLevel) {
                case LOW -> low++;
                case MEDIUM -> medium++;
                case HIGH -> high++;
                case CRITICAL -> critical++;
            }

            careList.add(CareTargetListResponseDTO.builder()
                    .careTargetId(ct.getCareTargetId())
                    .name(ct.getName())
                    .age(ct.getAge())
                    .gender(ct.getGender())
                    .disease(ct.getDisease())
                    .careTargetPhone(ct.getTargetPhone())
                    .riskLevel(riskLevel)
                    .build());
        }

        return CareGroupOneDetailResponseDTO.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .groupDescription(group.getGroupDescription())
                .scenarioName(group.getScenario() != null ? group.getScenario().getName() : "미지정")
                .scenarioDescription(group.getScenario() != null ? group.getScenario().getDescription() : "")
                .careTargetCount(String.valueOf(careList.size()))
                .groupStatus(group.getGroupStatus())
                .createdByName(group.getCreatedBy() != null ? group.getCreatedBy().getName() : "알 수 없음") // 생성자 이름
                .createDate(group.getCreatedAt().format(formatter))
                .low(low)
                .medium(medium)
                .high(high)
                .critical(critical)
                .careList(careList)
                .build();
    }



    //그룹 삭제-------------------------------------------------------------------------

    @Transactional
    public void deleteGroup(Long groupId) {
        careTargetGroupMapRepository.deleteByGroupId(groupId);
        careTargetGroupRepository.deleteById(groupId);
    }


    //-----------------------------------------------------------------------------


    //그룹 수정---------------------------------------------------------------------
    @Override
    @Transactional
    public CareGroupOneDetailResponseDTO updateCareTargetGroup(CareGroupUpdateRequestDTO dto) {
        CareTargetGroup ctg = careTargetGroupRepository.findById(dto.getCareGroupId())
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹을 찾을 수 없습니다."));

        ctg.updateInfo(dto.getGroupName(), dto.getGroupDescription(), dto.getGroupStatus());

        if (dto.getCareGroupId() != null){
            careTargetGroupMapRepository.deleteByGroupIdAndCareTargetIds(dto.getCareGroupId(), dto.getCareTargetIds());
        }

        careTargetGroupRepository.save(ctg);

        return getCareTargetGroupDetail(dto.getOrganizationId(), dto.getCareGroupId());
    }
    //-----------------------------------------------------------------------------


    //그룹내 케대 추가------------------------------------------------

    @Override
    public CareGroupOneDetailResponseDTO addCareTargetInGroup(CareGroupUpdateRequestDTO dto) {
        CareTargetGroup ctg = careTargetGroupRepository.findById(dto.getCareGroupId())
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹을 찾을 수 없습니다."));


        List<CareTarget> careTargets = careTargetRepository.findAllById(dto.getCareTargetIds());

        for (CareTarget ct : careTargets){
            CareTargetGroupMap cg = CareTargetGroupMap.builder()
                    .group(ctg)
                    .careTarget(ct)
                    .build();
            careTargetGroupMapRepository.save(cg);
        }

        return getCareTargetGroupDetail(dto.getOrganizationId(), dto.getCareGroupId());
    }
    //----------------------------------------------------------------



    //스케줄 등록(그룹 or 개인)-----------------------------------------------------------
    @Override
    @Transactional
    public List<CareGroupCallScheduleResponseDTO> saveOrUpdateCareGroupCallSchedule(CareGroupScheduleRequestDTO dto, Long userId) {

        Organization ogz = organizationRepository.findById(dto.getOrganizationId())
                .orElseThrow(() -> new IllegalArgumentException("해당 조직을 찾을 수 없습니다"));
        CareTargetGroup ctg = careTargetGroupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 날짜 파싱 로직
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        LocalDateTime scheduledTime = LocalDateTime.parse(dto.getScheduledTime(), formatter);
        LocalDateTime recurrenceEndDate = (dto.getRecurrenceEndDate() != null && !dto.getRecurrenceEndDate().isEmpty())
                ? LocalDateTime.parse(dto.getRecurrenceEndDate(), formatter) : null;

        CallSchedule callSchedule;
        if (dto.getScheduleId() != null) {
            // 1. 수정 모드
            callSchedule = callScheduleRepository.findById(dto.getScheduleId())
                    .orElseThrow(() -> new IllegalArgumentException("수정할 스케줄을 찾을 수 없습니다."));

            // 필드 업데이트 (Dirty Checking 활용)
            callSchedule.updateSchedule(
                    scheduledTime,
                    dto.getType(),
                    dto.getRecurrence(),
                    recurrenceEndDate,
                    dto.getPriority(),
                    dto.getMemo()
            );
             // 스케줄링 폴링용: SCHEDULED 상태일 때 수정된 scheduledTime으로 next_run_at 동기화
             if (scheduledTime != null && callSchedule.getStatus() == ScheduleStatus.SCHEDULED) {
                 callSchedule.rescheduleNextRunAt(scheduledTime);
             }
        } else {
            // 2. 등록 모드
            callSchedule = CallSchedule.builder()
                    .organization(ogz)
                    .targetType(ScheduleTargetType.GROUP)
                    .group(ctg)
                    .scheduledTime(scheduledTime)
                    .type(dto.getType())
                    .recurrence(dto.getRecurrence())
                    .recurrenceEndDate(recurrenceEndDate)
                    .priority(dto.getPriority())
                    .createdBy(user)
                    .memo(dto.getMemo())
                    .build();
            callScheduleRepository.save(callSchedule);

        }

        return getCareGroupCallScheduleList(ctg.getGroupId(), dto.getOrganizationId());
    }
    //------------------------------------------------------------------------


    //조회--------------------------------------------------------------------
    @Override
    public List<CareGroupCallScheduleResponseDTO> getCareGroupCallScheduleList(Long groupId, Long organizationId) {

        List<CallSchedule> cs = callScheduleRepository.findAllByGroupIdAndOrgId(groupId, organizationId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        List<CareGroupCallScheduleResponseDTO> results = new ArrayList<>();
        for (CallSchedule c : cs) {
            CareGroupCallScheduleResponseDTO csrDto = CareGroupCallScheduleResponseDTO.builder()
                    .scheduleId(c.getScheduleId())
                    .scheduledTime(c.getScheduledTime() != null ? c.getScheduledTime().format(formatter) : null)
                    .type(c.getType() != null ? c.getType().getKoName() : null)
                    // recurrence가 null일 경우 getKoName() 호출 방지
                    .recurrence(c.getRecurrence() != null ? c.getRecurrence().getKoName() : null)
                    // status가 null일 경우를 대비해 기본값 설정
                    .scheduleStatus(c.getStatus() != null ? c.getStatus().getKoName() : "대기")
                    // 종료일이 null일 경우 format() 호출 방지
                    .recurrenceEndDate(c.getRecurrenceEndDate() != null ? c.getRecurrenceEndDate().format(formatter) : null)
                    .priority(c.getPriority() != null ? c.getPriority().getKoName() : null)
                    .memo(c.getMemo())
                    .build();
            results.add(csrDto);
        }
        return results;
    }


    //스케줄 삭제
    //--------------------------------------------

    @Override
    @Transactional
    public void deleteGroupCallSchedule(Long groupId, Long scheduleId) {
        CallSchedule schedule = callScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("해당 스케줄을 찾을 수 없습니다."));
        if (!schedule.getGroup().getGroupId().equals(groupId)) {
            throw new IllegalArgumentException("해당 그룹의 스케줄이 아닙니다.");
        }
        callScheduleRepository.delete(schedule);
        }
    //-----------------------------------------
}

