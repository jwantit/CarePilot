package com.carepilot.service.caretarget;


import com.carepilot.domain.call.*;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.*;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.dto.caretarget.CareTargetInsertRequestDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
public class CareTargetServiceTests {

    private static final Logger log = LoggerFactory.getLogger(CareTargetServiceTests.class);
    @Autowired
    private CareService careService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private CareTargetRepository careTargetRepository;

    @Autowired
    private CallRepository callRepository;

    @Autowired
    private CallScheduleRepository callScheduleRepository;

    @Autowired
    private RiskScoreRepository riskScoreRepository;

    @Autowired
    private UserRepository userRepository;


    @Test
    @Transactional
    @Commit
    public void testInsertCareTargetOne() {

        Organization organization = organizationRepository.findById(1L).orElseThrow();

        List<MultipartFile> multipartFiles = null;
        for (int i = 0; i <= 9; i++ ){
            CareTargetInsertRequestDTO careTargetInsertRequestDTO = CareTargetInsertRequestDTO.builder()
                    .name("박남정" + i)
                    .age(60 + i + 2)
                    .gender("남성")
                    .disease("당뇨병" + i)
                    .careStatus(true)
                    .targetPhone("010-" + i + "333-0000" )
                    .guardianName("박찬욱" + i)
                    .guardianPhone("010-" + i + "444-0000")
                    .guardianRelationship("배우자")
                    .organizationId(organization.getOrganizationId())
                    .doctorId(1L)
                    .build();

            careService.careTargetInsert(careTargetInsertRequestDTO, multipartFiles);
        }
    }

    @Test
    @Transactional
    @Commit
    public void testAll() {
        Organization organization = organizationRepository.findById(1L).orElseThrow();
        CareTarget careTarget = careTargetRepository.findById(74L).orElseThrow();
        log.info("대상자 확인: " + careTarget.getName());

        // 1. 첫 번째 상담 세트 (과거: 1월 11일)
        // ------------------------------------------------------
        CallSchedule schedule1 = CallSchedule.builder()
                .organization(organization)
                .targetType(ScheduleTargetType.CARE_TARGET)
                .careTarget(careTarget)
                .scheduledTime(LocalDateTime.of(2026, 1, 11, 10, 0))
                .type(ScheduleType.RECURRING)
                .priority(Priority.LOW)
                .status(ScheduleStatus.COMPLETED)
                .memo("초기 안부 확인 상담")
                .build();
        callScheduleRepository.save(schedule1);

        Call call1 = Call.builder()
                .organization(organization)
                .careTarget(careTarget)
                .callSchedule(schedule1)
                .direction(CallDirection.OUTBOUND)
                .callType(CallType.EMERGENCY)
                .status(CallStatus.SUCCESS)
                .duration(120)
                .startTime(LocalDateTime.of(2026, 1, 11, 10, 5))
                .endTime(LocalDateTime.of(2026, 1, 11, 10, 7))
                .summary("첫 안부 전화. 전반적으로 양호하심.")
                .build();
        callRepository.save(call1);

        // [RiskScore 1] 1월 11일 - 점수 낮음 (정상)
        RiskScore score1 = RiskScore.builder()
                .organization(organization)
                .careTarget(careTarget)
                .call(call1)
                .riskScore(15)
                .riskLevel(RiskLevel.LOW)
                .calculatedAt(LocalDateTime.of(2026, 1, 11, 10, 10))
                .build();
        riskScoreRepository.save(score1);


        // 2. 두 번째 상담 세트 (7일 뒤: 1월 18일)
        // ------------------------------------------------------
        // [RiskScore 2] 상담은 없었으나 시스템 점검으로 점수가 오른 시나리오 (중간 기록)
        RiskScore score2 = RiskScore.builder()
                .organization(organization)
                .careTarget(careTarget)
                .riskScore(45)
                .riskLevel(RiskLevel.MEDIUM)
                .calculatedAt(LocalDateTime.of(2026, 1, 18, 0, 0))
                .build();
        riskScoreRepository.save(score2);


        // 3. 세 번째 상담 세트 (또 7일 뒤: 1월 25일 응급 상황)
        // ------------------------------------------------------
        CallSchedule schedule2 = CallSchedule.builder()
                .organization(organization)
                .targetType(ScheduleTargetType.CARE_TARGET)
                .careTarget(careTarget)
                .scheduledTime(LocalDateTime.of(2026, 1, 25, 0, 0))
                .type(ScheduleType.RECURRING)
                .recurrence(ScheduleRecurrence.DAILY)
                .priority(Priority.HIGH)
                .status(ScheduleStatus.COMPLETED)
                .memo("최근 혈당 수치 반드시 확인")
                .build();
        callScheduleRepository.save(schedule2);

        Call call2 = Call.builder()
                .organization(organization)
                .careTarget(careTarget)
                .callSchedule(schedule2)
                .direction(CallDirection.INBOUND)
                .callType(CallType.EMERGENCY)
                .status(CallStatus.SUCCESS)
                .duration(300)
                .startTime(LocalDateTime.of(2026, 1, 25, 10, 0))
                .endTime(LocalDateTime.of(2026, 1, 25, 10, 5))
                .summary("응급 버튼 호출 상담. 긴급 대처 완료.")
                .aiMemo("호흡 곤란 호소 기록 있음.")
                .build();
        callRepository.save(call2);

        // [RiskScore 3] 1월 25일 - 점수 급상승 (위험)
        RiskScore score3 = RiskScore.builder()
                .organization(organization)
                .careTarget(careTarget)
                .call(call2)
                .riskScore(88)
                .riskLevel(RiskLevel.HIGH)
                .calculatedAt(LocalDateTime.of(2026, 1, 25, 10, 6))
                .build();
        riskScoreRepository.save(score3);

        // 4. 다음 예정 스케줄 (미래: 1월 26일)
        // ------------------------------------------------------
        CallSchedule nextSchedule = CallSchedule.builder()
                .organization(organization)
                .targetType(ScheduleTargetType.CARE_TARGET)
                .careTarget(careTarget)
                .scheduledTime(LocalDateTime.of(2026, 1, 26, 14, 0))
                .type(ScheduleType.RECURRING)
                .status(ScheduleStatus.SCHEDULED)
                .priority(Priority.MEDIUM)
                .memo("응급 호출 이후 추적 관찰 상담")
                .build();
        callScheduleRepository.save(nextSchedule);
    }

    @Test
    @Transactional
    @Commit
    public void testUser() {

        Organization organization = organizationRepository.findById(1L).orElseThrow();

        User user = User.builder()
                .email("gktjd1122@gmail.com")
                .password("1111")
                .name("전상수")
                .phone("010-9999-9999")
                .role(UserRole.USER)
                .organization(organization)
                .status(UserStatus.ACTIVE)
                .build();
        User user1 = userRepository.save(user);


    }

}
