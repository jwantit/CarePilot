package com.carepilot.service.aiChat;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.dto.caretarget.CareTargetDetailResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetGroupRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.caretarget.CareService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class VectorIndexingService {

    @Autowired
    private CareService careService;
    @Autowired
    private CareTargetRepository careTargetRepository;
    @Autowired
    private CareTargetGroupMapRepository careTargetGroupMapRepository;
    @Autowired
    private CareTargetGroupRepository careTargetGroupRepository;
    @Autowired
    private CallScheduleRepository callScheduleRepository;
    @Autowired
    private OrganizationRepository organizationRepository;

    private final VectorStore vectorStore;

    public VectorIndexingService(@Qualifier("ChatBotVectorStore") VectorStore vectorStore1) {
        this.vectorStore = vectorStore1;
    }


    //주기적 RAG 동기화 백터 DB------------------------------------
   @Async // 비동기로 처리하여 메인 스레드 부하 방지
//   @Scheduled(cron = "0 0/30 * * * *") // 30분에 한 번 실행
//   @Scheduled(cron = "0 * * * * *") //1분
//   @Scheduled(cron = "0 0 */2 * * *") // 2시간마다 (0분 0초에 실행)
   public void runBatchIndexing() {
       log.info("[정기 Batch 인덱싱 시작] 시간: {}", LocalDateTime.now());

       // 1. 모든 조직 ID 가져오기
       List<Long> allOrganizationIds = organizationRepository.findAllIds();

       if (allOrganizationIds == null || allOrganizationIds.isEmpty()) {
           log.warn("인덱싱할 조직이 존재하지 않습니다.");
           return;
       }

       // 2. 모든 조직을 순회하며 기존 로직 수행
       for (Long organizationId : allOrganizationIds) {
           try {
               processOrganizationIndexing(organizationId);
           } catch (Exception e) {
               log.error("[조직 ID: {}] 인덱싱 중 치명적 오류 발생: {}", organizationId, e.getMessage());
           }
       }

       log.info("[정기 Batch 인덱싱 전체 완료]");
   }

    //-----------------
    private void processOrganizationIndexing(Long organizationId) {
        log.info("[Batch 인덱싱 진행 중] 조직 ID: {}", organizationId);

        // 1. 해당 조직의 모든 대상자 ID 조회
        List<Long> careTargetIds = careTargetRepository.findIdsByOrganizationId(organizationId);
        if (careTargetIds.isEmpty()) {
            log.info("[조직 ID: {}] 대상자가 없어 건너뜁니다.", organizationId);
            return;
        }

        List<String> docIdsToDelete = careTargetIds.stream()
                .map(id -> "careTargetId_" + id).toList();
        try {
            vectorStore.delete(docIdsToDelete);
        } catch (Exception e) {
            log.warn("[조직 ID: {}] 기존 데이터 삭제 실패(무시): {}", organizationId, e.getMessage());
        }

        List<Document> documentsToUpload = new ArrayList<>();

        for (Long ctId : careTargetIds) {
            try {
                // 기존 변환 로직 그대로 유지
                CareTargetDetailResponseDTO ctr = careService.getCareTargetDetail(organizationId, ctId);

                String groupNames = careTargetGroupMapRepository.findGroupsByCareTargetId(ctId).stream()
                        .map(CareTargetGroup::getGroupName)
                        .collect(Collectors.joining(", "));

                String slimContent = String.format(
                        "케어 대상자(환자) careTargetId:%d | 성함:%s | %s(%d세) | " +
                                "본인연락처:%s | 보호자:%s(%s, %s) | 주요질환:%s | " +
                                "소속그룹:%s | 검색키워드:%s, %s | organizationId:%d",
                        ctId,
                        ctr.getName(),
                        ctr.getGender(), ctr.getAge(),
                        ctr.getTargetPhone() != null ? ctr.getTargetPhone() : "없음",
                        ctr.getGuardianName(), ctr.getGuardianRelationship(),
                        ctr.getGuardianPhone() != null ? ctr.getGuardianPhone() : "없음",
                        ctr.getDisease() != null ? ctr.getDisease() : "없음",
                        groupNames.isEmpty() ? "없음" : groupNames,
                        ctr.getName(), ctr.getDisease(),
                        organizationId
                );

                // 메타데이터 설정 (필터링용)
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("organizationId", organizationId);
                metadata.put("careTargetId", ctId);
                metadata.put("careTargetName", ctr.getName());

                documentsToUpload.add(new Document("careTargetId_" + ctId, slimContent, metadata));

            } catch (Exception e) {
                log.error("[조직 ID: {}] 대상자(ID:{}) 변환 중 오류 발생: {}", organizationId, ctId, e.getMessage());
            }
        }

        if (!documentsToUpload.isEmpty()) {
            vectorStore.add(documentsToUpload);
            log.info("[조직 ID: {}] 총 {}건의 환자 정보 동기화 완료", organizationId, documentsToUpload.size());
        }
    }
     //-----------------

    //환자 상세 조회시 로직 ------------------------------------------------------------------
    public String generateCareTargetFinalContent(Long organizationId, Long ctId) {
        // 1. 기초 데이터 로드 (기존 리스너 로직과 동일)
        CareTargetDetailResponseDTO ctr = careService.getCareTargetDetail(organizationId, ctId);
        List<CareTargetGroup> ctgs = careTargetGroupMapRepository.findGroupsByCareTargetId(ctId);
        List<CallSchedule> sch = callScheduleRepository.findByCareTargetId(organizationId, ctId, LocalDateTime.now());

        List<ScheduleResponseDTO> scheduleCareTarget = sch.stream().map(ScheduleResponseDTO::from).toList();
        List<ScheduleResponseDTO> scheduleCareGroup = new ArrayList<>();
        List<CareGroupDetailResponseDTO> cgdrs = new ArrayList<>();

        for (CareTargetGroup ctg : ctgs) {
            cgdrs.add(CareGroupDetailResponseDTO.builder()
                    .groupId(ctg.getGroupId())
                    .groupName(ctg.getGroupName())
                    .groupDescription(ctg.getGroupDescription())
                    .build());

            List<CallSchedule> schs = callScheduleRepository.findAllUpcomingByGroupIdAndOrgId(ctg.getGroupId(), organizationId, LocalDateTime.now());
            scheduleCareGroup.addAll(schs.stream().map(ScheduleResponseDTO::from).toList());
        }

        // 2. 요약 데이터 생성 (기존 포맷 유지)
        String riskTrendSummary = ctr.getRiskTrendDTOS().stream()
                .limit(10)
                .map(r -> String.format("%s일(위험도 %d점)", r.getDate(), r.getScore()))
                .collect(Collectors.joining(" -> "));

        String callHistorySummary = ctr.getCallHistoryDTOS().stream()
                .limit(5)
                .map(c -> {
                    String koType = switch (c.getCallType()) {
                        case "REGULAR_MONITORING" -> "정기 모니터링";
                        case "EMERGENCY" -> "긴급 통화";
                        case "MEDICATION_CHECK" -> "약물 확인";
                        case "SYMPTOM_CHECK" -> "증상 체크";
                        case "FOLLOW_UP" -> "후속 조치";
                        default -> "기타 통화";
                    };
                    String koStatus = switch (c.getStatus()) {
                        case "SUCCESS" -> "통화 성공";
                        case "FAILED" -> "통화 실패";
                        case "NO_ANSWER" -> "무응답";
                        case "CANCELLED" -> "취소됨";
                        default -> "상태 불명";
                    };
                    return String.format(",[통화한 날짜:(%s),통화타입:(%s), 통화요약:(%s) 통화경과:(%s)]",
                            c.getStartTime(), koType, c.getSummary(), koStatus);
                })
                .collect(Collectors.joining("\n"));

        String groupInfo = cgdrs.stream()
                .map(g -> String.format("- %s: %s", g.getGroupName(), g.getGroupDescription()))
                .collect(Collectors.joining("\n"));

        StringBuilder scheduleSummary = new StringBuilder();
        scheduleCareTarget.forEach(s -> scheduleSummary.append(
                String.format("[개인 통화 예약 | 성함: %s | scheduledId: %s | 예정일: (%s) | 우선도: (%s) | 예약메모: (%s)]\n",
                        ctr.getName(), s.getScheduleId(), s.getScheduledTime(), s.getPriorityLabel(), s.getMemo())));
        scheduleCareGroup.forEach(s -> scheduleSummary.append(
                String.format("[그룹 통화 예약 | scheduledId: %s | 예정일: (%s) | 그룹명: (%s) | 우선도: (%s) | 예약메모: (%s)]\n",
                        s.getScheduleId(), s.getScheduledTime(), s.getTargetGroupName(), s.getPriorityLabel(), s.getMemo())));

        // 3. 기존의 String.format 포맷 그대로 반환
        return String.format(
                "속해있는 조직ID organizationId:%s" +
                        "케어 대상자(환자) careTargetId:%s   %s님은 %s이며 현재 %d세입니다. " +
                        "핵심 검색 키워드는 %s, %s, 보호자 %s입니다. " +
                        "이 문서는 %s님의 상세 기록을 포함하고 있습니다. " +
                        "대상자(케어대상자)의 성함은 %s님이며 보호자는 %s님으로 둘은 %s관계입니다. " +
                        "대상자 본인의 연락처는 %s이며, 보호자 %s님의 연락처는 %s입니다. " +
                        "%s님의 담당 의료진 이름은 %s이며, 진료과는 %s 입니다. %s 대상자의  주요 질환은 %s입니다. " +
                        "%s님의 님의 최근 위험도 점수 추이는 다음과 같습니다. %s, %s님에 대해 AI가 기록한 메모 내용은 %s입니다. " +
                        "%s님이 소속된 케어그룹의 정보는 [그룹이름,그룹설명] %s이며, %s 님의 최근 통화 기록들은 이와 같습니다.[날짜,타입,요약,상태] %s입니다. " +
                        "마지막으로 %s님의 향후 예정된 통화 스케줄은 [케어대상자의 예정된 통화 스케줄 과, 케어대상자가 속한 케어 그룹의 단체통화 스케줄] 은 다음과 같습니다.%s.",

                organizationId, ctId, ctr.getName(), ctr.getGender(), ctr.getAge(),
                ctr.getName(), ctr.getGender(), ctr.getGuardianName(),
                ctr.getName(),
                ctr.getName(), ctr.getGuardianName(), ctr.getGuardianRelationship(),
                ctr.getTargetPhone(), ctr.getGuardianName(), ctr.getGuardianPhone(),
                ctr.getName(), ctr.getCareTargetDoctorResponseDTO() != null ? ctr.getCareTargetDoctorResponseDTO().getDoctorName() : "정보없음",
                ctr.getCareTargetDoctorResponseDTO() != null ? ctr.getCareTargetDoctorResponseDTO().getDoctorSpecialty() : "진료과 없음",
                ctr.getName(), ctr.getDisease() != null ? ctr.getDisease() : "정보없음.",
                ctr.getName(), riskTrendSummary.isEmpty() ? "기록 없음" : riskTrendSummary,
                ctr.getName(), ctr.getAiMemo() != null ? ctr.getAiMemo() : "없음",
                ctr.getName(), groupInfo.isEmpty() ? "정보없음" : groupInfo,
                ctr.getName(), callHistorySummary.isEmpty() ? "최근 이력 없음" : callHistorySummary,
                ctr.getName(), scheduleSummary.isEmpty() ? "예정 스케줄 없음" : scheduleSummary.toString()
        );
    }


}