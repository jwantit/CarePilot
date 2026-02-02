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
import com.carepilot.service.caretarget.CareService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
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

    private final VectorStore vectorStore;

    public VectorIndexingService(@Qualifier("ChatBotVectorStore") VectorStore vectorStore1) {
        this.vectorStore = vectorStore1;
    }


   //백터 인댁싱
//    @EventListener
//    public void saveOrUpdate(CareTargetSyncEvent event) {
//        log.info("🚀 벡터 DB 인덱싱 시작 - 조직: {}", event.organizationId());
//
//        Long organizationId = event.organizationId();
//        List<Long> careTargetIds = careTargetRepository.findIdsByOrganizationId(organizationId);
//
//        if (!careTargetIds.isEmpty()) {
//            List<String> docIdsToDelete = careTargetIds.stream()
//                    .map(id -> "careTargetId_" + id).toList();
//            try {
//                vectorStore.delete(docIdsToDelete);
//            } catch (Exception e) {
//                log.warn("삭제 실패(무시): {}", e.getMessage());
//            }
//        }
//
//        for (Long ctId : careTargetIds) {
//            CareTargetDetailResponseDTO ctr = careService.getCareTargetDetail(organizationId, ctId);
//            List<CareTargetGroup> ctgs = careTargetGroupMapRepository.findGroupsByCareTargetId(ctId);
//
//            String groupInfo = ctgs.stream()
//                    .map(g -> String.format("[그룹이름:%s|(groupId:%d)|그룹설명:%s]", g.getGroupName(), g.getGroupId(), g.getGroupDescription()))
//                    .collect(Collectors.joining(", "));
//
//            StringBuilder scheduleSummary = new StringBuilder();
//            callScheduleRepository.findByCareTargetId(organizationId, ctId, LocalDateTime.now()).forEach(s ->
//                    scheduleSummary.append(String.format("[개인예약|scheduleId:%s|일시:%s|메모:%s] ", s.getScheduleId(), s.getScheduledTime(), s.getMemo())));
//
//            for (CareTargetGroup ctg : ctgs) {
//                callScheduleRepository.findAllUpcomingByGroupIdAndOrgId(ctg.getGroupId(), organizationId, LocalDateTime.now()).forEach(s ->
//                        scheduleSummary.append(String.format("[그룹예약:%s|scheduleId:%s|일시:%s|메모:%s] ", ctg.getGroupName(), s.getScheduleId(), s.getScheduledTime(), s.getMemo())));
//            }
//
//            // 4. 최종 리포트 생성 (포맷 문구와 변수 개수 12개 일치 확인)
//            String finalContent = String.format(
//                    "케어 대상자(환자) careTargetId:%s | %s님은 %s이며 현재 %s세입니다. " +
//                            "주요 질환은 %s이며 보호자는 %s(%s)입니다. " +
//                            "상세한 과거 통화 이력 및 위험도 추이는 상세 조회 툴을 이용하세요. " +
//                            "현재 소속된 케어그룹 정보: %s. " +
//                            "향후 예정된 통화 스케줄: %s. " +
//                            "검색 키워드: %s, %s, %s | " +
//                            "속해있는 조직ID organizationId: %s", // 총 12개의 %s
//
//                    ctId,                   // 1
//                    ctr.getName(),          // 2
//                    ctr.getGender(),        // 3
//                    ctr.getAge(),           // 4
//                    ctr.getDisease() != null ? ctr.getDisease() : "없음", // 5
//                    ctr.getGuardianName(),  // 6
//                    ctr.getGuardianRelationship(), // 7
//                    groupInfo.isEmpty() ? "없음" : groupInfo, // 8
//                    scheduleSummary.isEmpty() ? "예정된 스케줄 없음" : scheduleSummary.toString(), // 9
//                    ctr.getName(),          // 10
//                    ctr.getGuardianName(),  // 11
//                    ctr.getDisease(),       // 12
//                    organizationId          // 13 (아, 위 문구에 %s 하나 더 추가했습니다)
//            );
//
//            Map<String, Object> metadata = new HashMap<>();
//            metadata.put("organizationId", organizationId);
//            metadata.put("careTargetId", ctId);
//            metadata.put("careTargetName", ctr.getName());
//            metadata.put("groupIds", ctgs.stream().map(g -> String.valueOf(g.getGroupId())).toList());
//
//            Document doc = new Document("careTargetId_" + ctId, finalContent, metadata);
//            vectorStore.add(List.of(doc));
//            log.info("인덱싱 완료: {}", ctr.getName());
//        }
//    }
   @Async // 비동기로 처리하여 사용자 응답 속도 저하 방지
   @EventListener
   public void saveOrUpdate(CareTargetSyncEvent event) {
       Long organizationId = event.organizationId();
       log.info("🚀 [Batch 인덱싱 시작] 조직 ID: {}", organizationId);

       // 1. 해당 조직의 모든 대상자 ID 조회
       List<Long> careTargetIds = careTargetRepository.findIdsByOrganizationId(organizationId);
       if (careTargetIds.isEmpty()) return;

       // 2. 기존 벡터 데이터 전체 삭제 (조직 단위)
       List<String> docIdsToDelete = careTargetIds.stream()
               .map(id -> "careTargetId_" + id).toList();
       try {
           vectorStore.delete(docIdsToDelete);
       } catch (Exception e) {
           log.warn("기존 데이터 삭제 실패(무시): {}", e.getMessage());
       }

       List<Document> documentsToUpload = new ArrayList<>();

       for (Long ctId : careTargetIds) {
           try {
               CareTargetDetailResponseDTO ctr = careService.getCareTargetDetail(organizationId, ctId);

               String groupNames = careTargetGroupMapRepository.findGroupsByCareTargetId(ctId).stream()
                       .map(CareTargetGroup::getGroupName)
                       .collect(Collectors.joining(", "));

               String slimContent = String.format(
                       "케어 대상자(환자) careTargetId:%d | 성함:%s | %s(%d세) | " +
                               "본인연락처:%s | 보호자:%s(%s, %s) | 주요질환:%s | " +
                               "소속그룹:%s | 검색키워드:%s, %s | organizationId:%d",
                       ctId,                                           // ID
                       ctr.getName(),                                  // 이름
                       ctr.getGender(), ctr.getAge(),                  // 성별, 나이
                       ctr.getTargetPhone() != null ? ctr.getTargetPhone() : "없음",   // 본인 번호
                       ctr.getGuardianName(), ctr.getGuardianRelationship(),
                       ctr.getGuardianPhone() != null ? ctr.getGuardianPhone() : "없음", // 보호자 정보
                       ctr.getDisease() != null ? ctr.getDisease() : "없음",           // 질환
                       groupNames.isEmpty() ? "없음" : groupNames,                      // 그룹명
                       ctr.getName(), ctr.getDisease(),                               // 키워드
                       organizationId                                                 // 조직ID
               );

               // 메타데이터 설정 (필터링용)
               Map<String, Object> metadata = new HashMap<>();
               metadata.put("organizationId", organizationId);
               metadata.put("careTargetId", ctId);
               metadata.put("careTargetName", ctr.getName());

               documentsToUpload.add(new Document("careTargetId_" + ctId, slimContent, metadata));

           } catch (Exception e) {
               log.error("대상자(ID:{}) 변환 중 오류 발생: {}", ctId, e.getMessage());
           }
       }

       if (!documentsToUpload.isEmpty()) {
           vectorStore.add(documentsToUpload);
           log.info("[Batch 인덱싱 완료] 총 {}건의 환자 정보 동기화", documentsToUpload.size());
       }
   }

    //환자 상세 조회시 ------------------------------------------------------------------
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