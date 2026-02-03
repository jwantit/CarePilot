package com.carepilot;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.CallType;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.config.DoctorRole;
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.notice.NoticeComment;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.file.UploadFileType;
import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.prescription.Prescription;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.OutboundSms;
import com.carepilot.domain.sms.SentBy;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetGroupRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.DoctorRepository;
import com.carepilot.repository.config.ScenarioQuestionRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.repository.notice.NoticeCommentRepository;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.prescription.PrescriptionRepository;
import com.carepilot.repository.sms.InboundSmsRepository;
import com.carepilot.repository.sms.OutboundSmsRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 더미 데이터 일괄 삽입용 픽스처.
 * 실행 시 Organization, Doctor, User, Scenario, CareTarget, CallSchedule, Call, Notification 순서로 저장.
 * 이미 있으면 건너뛰고 없을 때만 생성. 반복 실행해도 중복 에러 없음.
 */
@SpringBootTest
@Transactional
@Commit
@Slf4j
public class TestData {

    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ScenarioRepository scenarioRepository;
    @Autowired
    private ScenarioQuestionRepository scenarioQuestionRepository;
    @Autowired
    private CareTargetRepository careTargetRepository;
    @Autowired
    private CareTargetGroupRepository careTargetGroupRepository;
    @Autowired
    private CareTargetGroupMapRepository careTargetGroupMapRepository;
    @Autowired
    private CallScheduleRepository callScheduleRepository;
    @Autowired
    private CallRepository callRepository;
    @Autowired
    private CallRecordingRepository callRecordingRepository;
    @Autowired
    private UploadFileRepository uploadFileRepository;
    @Autowired
    private RiskScoreRepository riskScoreRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private NoticeRepository noticeRepository;
    @Autowired
    private NoticeCommentRepository noticeCommentRepository;
    @Autowired
    private InboundSmsRepository inboundSmsRepository;
    @Autowired
    private OutboundSmsRepository outboundSmsRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "test1111!";

    /** 테스트 더미 식별자 (있으면 재사용, 없으면 생성) */
    private static final String[] TEST_ORG_NUMBERS = { "ORG-001", "ORG-002" };
    private static final String[] TEST_ORG_NAMES = { "서울삼성요양병원", "강남재활센터" };
    private static final String TEST_USER_EMAIL_DOMAIN = "care.com";
    private static final String TEST_DOCTOR_EMAIL_SUFFIX = ".carepilot.kr";

    /** 실명 느낌 이름: 의료진 20명 */
    private static final String[] DOCTOR_NAMES = {
            "김민준", "이서연", "박지우", "최유나", "정준혁",
            "강민서", "조예진", "윤도현", "장수빈", "한지훈",
            "오승민", "신지아", "홍예준", "권나영", "송민재",
            "김하은", "이준서", "박서현", "최지민", "정유진"
    };

    /** 실명 느낌 이름: 사용자 20명 (업체1: 1~10, 업체2: 11~20. 1의자리 1~5 USER, 6~9 MANAGER, 0 ADMIN) */
    private static final String[] USER_NAMES = {
            "김도훈", "이수진", "박성민", "최나영", "정현우", "강지훈", "조서영", "윤민재", "장예은", "홍관리",   // 업체1: 1~10
            "오도훈", "신수진", "한성민", "권나영", "송현우", "김지훈", "이서영", "박민재", "최예은", "정관리"    // 업체2: 11~20
    };

    /** 의료진 전문과 (20개) */
    private static final String[] SPECIALTIES = {
            "내과", "정형외과", "신경과", "재활의학과", "가정의학과",
            "심장내과", "호흡기내과", "소화기내과", "신장내과", "내분비내과",
            "정신건강의학과", "피부과", "이비인후과", "안과", "외과",
            "마취통증의학과", "영상의학과", "진단검사의학과", "응급의학과", "한방과"
    };

    /** 시나리오 이름 (업체당 2개, 있으면 건너뜀) */
    private static final String[] SCENARIO_NAMES = { "일상 건강 체크", "고위험 환자 확인" };

    /** 케어 대상자 실명·질병·보호자 (업체당 10명, 20명 분) */
    private static final String[] CARETARGET_NAMES = {
            "박남정", "김영희", "이철수", "최순자", "정만수",
            "강복순", "조경희", "윤동식", "장명자", "한기남",
            "오정숙", "신영자", "홍순이", "권일남", "송미자",
            "김갑수", "이영숙", "박동일", "최영자", "정순남"
    };
    private static final String[] CARETARGET_DISEASES = {
            "당뇨병", "고혈압", "치매", "관절염", "심부전",
            "폐질환", "신장질환", "뇌졸중 후유증", "파킨슨병", "골다공증",
            "당뇨·고혈압", "우울증", "불면증", "요실금", "알츠하이머",
            "척추질환", "심근경색 후유증", "갱년기 장애", "갑상선 질환", "빈혈"
    };
    /** 보호자 실명 (케어대상 20명에 대응) */
    private static final String[] GUARDIAN_NAMES = {
            "박정수", "김미영", "이동훈", "최지연", "정민호",
            "강수진", "조영수", "윤미라", "장성호", "한지은",
            "오준혁", "신유진", "홍대식", "권미선", "송재현",
            "김보라", "이성민", "박지현", "최영호", "정수진"
    };
    private static final String[] GUARDIAN_RELATIONSHIPS = { "배우자", "자녀", "며느리", "딸", "아들" };

    /** 케어 그룹 이름 (업체당 2개) */
    private static final String[] CARETARGET_GROUP_NAMES = { "일상 케어 그룹", "고위험 관리 그룹" };

    @Test
    @DisplayName("더미 데이터 일괄 삽입: Organization → Doctor → User → Scenario → ScenarioQuestion, 있으면 건너뜀")
    void insertAllDummyData() {
        log.info("=== 더미 데이터 생성 시작 ===");
        List<Organization> orgs = insertOrganizations();
        insertDoctors(orgs);
        insertUsers(orgs);
        List<Scenario> scenarios = insertScenarios(orgs);
        insertScenarioQuestions(scenarios);
        insertCareTargets(orgs);
        insertCareTargetGroups(orgs, scenarios);
        insertCallSchedules(orgs, scenarios);
        insertCalls(orgs);
        insertRiskScoreTrends(orgs);
        insertNotifications(orgs);
        insertTasks(orgs);
        insertNoticesAndComments(orgs);
        insertInboundAndOutboundSms(orgs);
        insertPrescriptions(orgs);
        log.info("=== 더미 데이터 생성 완료: Organization {}개, Doctor 20명, User 20명, Scenario {}개, CareTarget, CallSchedule, Call, Notification, Task, Notice, Comment, InboundSms, OutboundSms, Prescription ===", orgs.size(), scenarios.size());
    }

    /** Organization 2개 (있으면 재사용, 없으면 생성) */
    private List<Organization> insertOrganizations() {
        List<Organization> orgs = new ArrayList<>();
        for (int i = 0; i < TEST_ORG_NUMBERS.length; i++) {
            Organization org = organizationRepository.findByOrganizationNumber(TEST_ORG_NUMBERS[i]).orElse(null);
            if (org == null) {
                org = organizationRepository.save(Organization.builder()
                        .name(TEST_ORG_NAMES[i])
                        .organizationNumber(TEST_ORG_NUMBERS[i])
                        .build());
                log.info("Organization 신규: {} {}", org.getOrganizationNumber(), org.getName());
            } else {
                log.info("Organization 기존: {} {}", org.getOrganizationNumber(), org.getName());
            }
            orgs.add(org);
        }
        return orgs;
    }

    /** Doctor 20명 (org당 10명). 있으면 건너뛰고 없을 때만 생성 */
    private void insertDoctors(List<Organization> orgs) {
        List<Doctor> existingInOrgs = new ArrayList<>();
        for (Organization org : orgs) {
            existingInOrgs.addAll(doctorRepository.findByOrganization(org));
        }
        DoctorRole[] roles = { DoctorRole.DOCTOR, DoctorRole.DOCTOR, DoctorRole.NURSE, DoctorRole.OPERATOR, DoctorRole.ADMIN };
        int created = 0;
        for (int i = 0; i < 20; i++) {
            String email = "doc" + (i + 1) + "@org" + (i % 2 + 1) + TEST_DOCTOR_EMAIL_SUFFIX;
            if (existingInOrgs.stream().anyMatch(d -> email.equals(d.getEmail()))) {
                log.debug("기존 Doctor 건너뜀: {}", email);
                continue;
            }
            Organization org = orgs.get(i % orgs.size());
            String name = DOCTOR_NAMES[i];
            Doctor doctor = Doctor.builder()
                    .organization(org)
                    .name(name)
                    .email(email)
                    .phone("02-2" + String.format("%03d", 100 + i) + "-" + String.format("%04d", 1000 + i))
                    .specialty(SPECIALTIES[i])
                    .role(roles[i % roles.length])
                    .isActive(true)
                    .memo(i % 3 == 0 ? "담당 환자 다수" : null)
                    .build();
            doctorRepository.save(doctor);
            created++;
            log.debug("Doctor 신규 생성: {} ({}), {}", name, email, doctor.getSpecialty());
        }
        log.info("Doctor 처리 완료: 신규 {}명, 기존 건너뜀 (총 20명 목표)", created);
    }

    /** User 20명: 업체1은 user1~10, 업체2는 user11~20. 1의자리 1~5 USER, 6~9 MANAGER, 0 ADMIN. 있으면 건너뜀 */
    private void insertUsers(List<Organization> orgs) {
        String encodedPassword = passwordEncoder.encode(DEFAULT_PASSWORD);
        Organization org1 = orgs.get(0);
        Organization org2 = orgs.get(1);
        int created = 0;

        for (int n = 1; n <= 20; n++) {
            String email = "user" + n + "@" + TEST_USER_EMAIL_DOMAIN;
            if (userRepository.findByEmail(email).isPresent()) {
                log.debug("기존 User 건너뜀: {}", email);
                continue;
            }
            int ones = n % 10;
            UserRole role = ones >= 1 && ones <= 5 ? UserRole.USER
                    : (ones >= 6 && ones <= 9 ? UserRole.MANAGER : UserRole.ADMIN);
            Organization org = n <= 10 ? org1 : org2;
            String name = USER_NAMES[n - 1];
            User user = User.builder()
                    .email(email)
                    .password(encodedPassword)
                    .name(name)
                    .phone("010-" + String.format("%04d", 1000 + n) + "-" + String.format("%04d", 2000 + n))
                    .role(role)
                    .organization(org)
                    .status(UserStatus.ACTIVE)
                    .isSocial(false)
                    .build();
            userRepository.save(user);
            created++;
            log.debug("User 신규 생성: {} ({}), {} 업체{}", name, email, role, n <= 10 ? 1 : 2);
        }
        log.info("User 처리 완료: 신규 {}명, 기존 건너뜀 (업체1: user1~10, 업체2: user11~20. 1의자리 1~5 USER, 6~9 MANAGER, 0 ADMIN). 공통 비밀번호: {}", created, DEFAULT_PASSWORD);
    }

    /** Scenario: 업체당 2개 (있으면 재사용, 없으면 생성) */
    private List<Scenario> insertScenarios(List<Organization> orgs) {
        List<Scenario> result = new ArrayList<>();
        String[] descriptions = {
                "매일 환자의 기본적인 건강 상태를 확인하는 시나리오입니다.",
                "고위험 환자 대상 추가 확인 및 알림용 시나리오입니다."
        };
        RiskLevel[] riskLevels = { RiskLevel.LOW, RiskLevel.HIGH };
        String[] categories = { "건강관리", "위험관리" };
        int created = 0;
        for (Organization org : orgs) {
            List<Scenario> byOrg = scenarioRepository.findByOrganization(org);
            for (int i = 0; i < SCENARIO_NAMES.length; i++) {
                String name = SCENARIO_NAMES[i];
                Scenario existing = byOrg.stream().filter(s -> name.equals(s.getName())).findFirst().orElse(null);
                if (existing != null) {
                    result.add(existing);
                    log.debug("기존 Scenario 건너뜀: {} - {}", org.getName(), name);
                    continue;
                }
                Scenario scenario = Scenario.builder()
                        .organization(org)
                        .name(name)
                        .description(descriptions[i])
                        .category(categories[i])
                        .riskLevel(riskLevels[i])
                        .enabled(true)
                        .riskCriteria(i == 1 ? "기본 건강 지표 이상 시 알림" : null)
                        .createdBy(null)
                        .build();
                scenario = scenarioRepository.save(scenario);
                result.add(scenario);
                created++;
                log.info("Scenario 신규: {} - {}", org.getName(), name);
            }
        }
        log.info("Scenario 처리 완료: 신규 {}개, 기존 건너뜀 (업체당 2개)", created);
        return result;
    }

    /** ScenarioQuestion: 시나리오당 질문 있으면 건너뜀, 없으면 생성 */
    private void insertScenarioQuestions(List<Scenario> scenarios) {
        String[][] questionsByScenario = {
                { "오늘 컨디션이 어떠신가요?", "통증이나 불편함이 있으신가요?", "약물을 정상적으로 복용하셨나요?", "수면은 잘 주무셨나요?" },
                { "최근 혈압/혈당 수치를 확인해 주세요.", "특별히 불편한 증상이 있으신가요?", "다음 방문 일정을 확인해 주세요." }
        };
        int created = 0;
        for (Scenario scenario : scenarios) {
            if (!scenarioQuestionRepository.findByScenarioOrderByQuestionOrderAsc(scenario).isEmpty()) {
                log.debug("기존 ScenarioQuestion 건너뜀: scenario id={}", scenario.getScenarioId());
                continue;
            }
            String[] questions = questionsByScenario[SCENARIO_NAMES[0].equals(scenario.getName()) ? 0 : 1];
            for (int order = 0; order < questions.length; order++) {
                ScenarioQuestion q = ScenarioQuestion.builder()
                        .scenario(scenario)
                        .questionText(questions[order])
                        .questionOrder(order + 1)
                        .isRequired(order < 2)
                        .build();
                scenarioQuestionRepository.save(q);
                created++;
            }
        }
        log.info("ScenarioQuestion 처리 완료: 신규 {}개", created);
    }

    /** CareTarget: 업체당 10명 (있으면 targetPhone으로 건너뜀). 이름·질병·보호자 실제 서비스에 가깝게 */
    private void insertCareTargets(List<Organization> orgs) {
        int created = 0;
        for (int o = 0; o < orgs.size(); o++) {
            Organization org = orgs.get(o);
            List<CareTarget> existingInOrg = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            List<Doctor> doctors = doctorRepository.findByOrganization(org);
            Doctor doctor = doctors.isEmpty() ? null : doctors.get(0);
            int orgPrefix = 9001 + o; // 9001, 9002
            for (int i = 0; i < 10; i++) {
                int idx = o * 10 + i;
                String targetPhone = "010-" + orgPrefix + "-" + String.format("%04d", 1000 + i);
                boolean alreadyExists = existingInOrg.stream().anyMatch(c -> targetPhone.equals(c.getTargetPhone()));
                if (alreadyExists) {
                    log.debug("기존 CareTarget 건너뜀: {} {}", org.getName(), targetPhone);
                    continue;
                }
                String name = CARETARGET_NAMES[idx];
                String disease = CARETARGET_DISEASES[idx];
                String guardianName = GUARDIAN_NAMES[idx];
                String guardianPhone = "010-" + orgPrefix + "-" + String.format("%04d", 2000 + i);
                String relationship = GUARDIAN_RELATIONSHIPS[i % GUARDIAN_RELATIONSHIPS.length];
                CareTarget target = CareTarget.builder()
                        .organization(org)
                        .name(name)
                        .age(65 + (i % 25))
                        .gender(i % 2 == 0 ? "남성" : "여성")
                        .disease(disease)
                        .targetPhone(targetPhone)
                        .guardianName(guardianName)
                        .guardianPhone(guardianPhone)
                        .guardianRelationship(relationship)
                        .doctor(doctor)
                        .build();
                careTargetRepository.save(target);
                created++;
                log.debug("CareTarget 신규: {} - {} ({})", org.getName(), name, disease);
            }
        }
        log.info("CareTarget 처리 완료: 신규 {}명, 기존 건너뜀 (업체당 10명)", created);
    }

    /** CareTargetGroup: 업체당 2개 (있으면 groupName으로 건너뜀). CareTargetGroupMap으로 같은 업체 CareTarget 연결 */
    private void insertCareTargetGroups(List<Organization> orgs, List<Scenario> scenarios) {
        int groupsCreated = 0;
        int mapsCreated = 0;
        for (int o = 0; o < orgs.size(); o++) {
            Organization org = orgs.get(o);
            List<CareTargetGroup> existingGroups = careTargetGroupRepository.findAllByOrgId(org.getOrganizationId());
            List<CareTarget> careTargetsInOrg = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            List<Scenario> byOrg = scenarios.stream()
                    .filter(s -> s.getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .toList();
            Scenario scenarioDaily = byOrg.stream().filter(s -> SCENARIO_NAMES[0].equals(s.getName())).findFirst().orElse(null);
            Scenario scenarioRisk = byOrg.stream().filter(s -> SCENARIO_NAMES[1].equals(s.getName())).findFirst().orElse(null);
            String[] descriptions = { "일상 건강 체크 대상 그룹입니다.", "고위험 환자 관리 그룹입니다." };
            for (int i = 0; i < CARETARGET_GROUP_NAMES.length; i++) {
                String groupName = CARETARGET_GROUP_NAMES[i];
                CareTargetGroup group = existingGroups.stream()
                        .filter(g -> groupName.equals(g.getGroupName()))
                        .findFirst()
                        .orElse(null);
                if (group == null) {
                    Scenario scenario = i == 0 ? scenarioDaily : scenarioRisk;
                    group = CareTargetGroup.builder()
                            .organization(org)
                            .groupName(groupName)
                            .groupDescription(descriptions[i])
                            .scenario(scenario)
                            .groupStatus(true)
                            .createdBy(null)
                            .build();
                    group = careTargetGroupRepository.save(group);
                    groupsCreated++;
                    log.info("CareTargetGroup 신규: {} - {}", org.getName(), groupName);
                } else {
                    log.debug("기존 CareTargetGroup: {} - {}", org.getName(), groupName);
                }
                // CareTargetGroupMap: 그룹에 대상자 연결 (없으면 추가). 일상 케어=앞 5명, 고위험=뒤 5명
                List<CareTargetGroupMap> existingMaps = careTargetGroupMapRepository.findGroupDetails(org.getOrganizationId(), group.getGroupId());
                if (!existingMaps.isEmpty()) {
                    log.debug("기존 CareTargetGroupMap 건너뜀: group id={}", group.getGroupId());
                    continue;
                }
                int from = i == 0 ? 0 : 5;
                int to = Math.min(i == 0 ? 5 : 10, careTargetsInOrg.size());
                int linked = 0;
                for (int t = from; t < to; t++) {
                    CareTarget target = careTargetsInOrg.get(t);
                    careTargetGroupMapRepository.save(CareTargetGroupMap.builder()
                            .group(group)
                            .careTarget(target)
                            .build());
                    mapsCreated++;
                    linked++;
                }
                log.info("CareTargetGroupMap 연결: {} - {} (대상자 {}명)", org.getName(), groupName, linked);
            }
        }
        log.info("CareTargetGroup 처리 완료: 그룹 신규 {}개, CareTargetGroupMap {}개 연결", groupsCreated, mapsCreated);
    }

    /** CallSchedule: 개인 스케줄(대상자별) + 그룹 스케줄. 있으면 건너뜀 */
    private void insertCallSchedules(List<Organization> orgs, List<Scenario> scenarios) {
        LocalDateTime now = LocalDateTime.now();
        int created = 0;
        for (Organization org : orgs) {
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            List<CareTargetGroup> groups = careTargetGroupRepository.findAllByOrgId(org.getOrganizationId());
            List<Scenario> byOrg = scenarios.stream()
                    .filter(s -> s.getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .toList();
            Scenario scenarioDaily = byOrg.stream().filter(s -> SCENARIO_NAMES[0].equals(s.getName())).findFirst().orElse(null);
            // 개인 스케줄: 업체당 대상자 3명씩, 각 1건 (일회성 내일 9시)
            int individualLimit = Math.min(3, careTargets.size());
            for (int i = 0; i < individualLimit; i++) {
                CareTarget target = careTargets.get(i);
                if (!callScheduleRepository.findByCareTargetId(org.getOrganizationId(), target.getCareTargetId(), now).isEmpty()) {
                    log.debug("기존 CallSchedule(개인) 건너뜀: {} - {}", org.getName(), target.getName());
                    continue;
                }
                LocalDateTime scheduled = now.plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0).plusHours(i);
                CallSchedule schedule = CallSchedule.builder()
                        .organization(org)
                        .targetType(ScheduleTargetType.CARE_TARGET)
                        .careTarget(target)
                        .group(null)
                        .scheduledTime(scheduled)
                        .nextRunAt(scheduled)
                        .type(ScheduleType.ONE_TIME)
                        .recurrence(null)
                        .recurrenceEndDate(null)
                        .priority(Priority.MEDIUM)
                        .status(ScheduleStatus.SCHEDULED)
                        .scenario(scenarioDaily)
                        .memo("정기 건강 확인 통화 예약")
                        .createdBy(null)
                        .build();
                callScheduleRepository.save(schedule);
                created++;
            }
            // 그룹 스케줄: 업체당 그룹 2개, 각 1건 (반복 주간)
            for (CareTargetGroup group : groups) {
                if (!callScheduleRepository.findAllByGroupIdAndOrgId(group.getGroupId(), org.getOrganizationId()).isEmpty()) {
                    log.debug("기존 CallSchedule(그룹) 건너뜀: {} - {}", org.getName(), group.getGroupName());
                    continue;
                }
                LocalDateTime scheduled = now.plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
                LocalDateTime endDate = now.plusMonths(3);
                CallSchedule schedule = CallSchedule.builder()
                        .organization(org)
                        .targetType(ScheduleTargetType.GROUP)
                        .careTarget(null)
                        .group(group)
                        .scheduledTime(scheduled)
                        .nextRunAt(scheduled)
                        .type(ScheduleType.RECURRING)
                        .recurrence(ScheduleRecurrence.WEEKLY)
                        .recurrenceEndDate(endDate)
                        .priority(Priority.MEDIUM)
                        .status(ScheduleStatus.SCHEDULED)
                        .scenario(SCENARIO_NAMES[0].equals(group.getGroupName()) ? scenarioDaily : byOrg.stream().filter(s -> SCENARIO_NAMES[1].equals(s.getName())).findFirst().orElse(null))
                        .memo("그룹 대상 주간 건강 체크 통화")
                        .createdBy(null)
                        .build();
                callScheduleRepository.save(schedule);
                created++;
            }
        }
        log.info("CallSchedule 처리 완료: 신규 {}건 (개인 + 그룹)", created);
    }

    /** Call: 업체당 대상자 5명씩, 각 4건. 상태 SUCCESS/FAILED/NO_ANSWER/CANCELLED 골고루. SUCCESS만 Recording·UploadFile·RiskScore 생성 */
    private void insertCalls(List<Organization> orgs) {
        int created = 0;
        CallStatus[] statuses = { CallStatus.SUCCESS, CallStatus.FAILED, CallStatus.NO_ANSWER, CallStatus.CANCELLED };
        String[] summariesByStatus = {
                "정기 건강 확인 통화. 약 복용 정상, 특이 증상 없음.",
                "통화 연결 실패.",
                "무응답.",
                "통화 취소됨."
        };
        String[] transcripts = {
                """
                AI: 오늘 컨디션이 어떠신가요?
                케어대상: 좋아요!

                AI: 좋으시다니 정말 다행이네요. 통증이나 불편함이 있으신가요?
                케어대상: 아니요.

                AI: 약을 드시지 않으셨다니 걱정이 되네요. 혹시 오늘 약은 드셨나요?
                케어대상: 먹었습니다.

                요청사항: 다음 주 목요일 오후 3시에 예약 변경해 주세요.
                """,
                """
                AI: 요즘 잠은 잘 주무시나요?
                케어대상: 가끔 새벽에 깨요.

                AI: 그렇군요. 통증이나 불편함은 없으신가요?
                케어대상: 괜찮아요.

                AI: 다음 방문 일정 확인해 드릴게요. 이번 주 금요일 오후 2시 가능하신가요?
                케어대상: 네, 그때 가겠습니다.

                요청사항: 다음 주 금요일 오후 3시에 예약 변경해 주세요.
                """,
                """
                AI: 최근 혈압 수치 확인해 주셨나요?
                케어대상: 130에 80이에요.

                AI: 괜찮은 편이에요. 유지해 주세요. 약은 규칙적으로 드리고 계신가요?
                케어대상: 네, 아침에 꼭 먹어요.

                AI: 좋습니다. 다음에 또 연락드릴게요.
                케어대상: 감사해요.

                요청사항: 담당 의료진을 변경해주세요.
                """
        };
        String[] successSummaries = {
                "정기 건강 확인 통화. 약 복용 정상, 특이 증상 없음.",
                "수면 패턴 문의. 새벽 각성 있음. 추후 상담 예정.",
                "혈압 확인. 130/80 유지. 생활 습관 유지 권고."
        };
        for (Organization org : orgs) {
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            int limit = Math.min(5, careTargets.size());
            for (int i = 0; i < limit; i++) {
                CareTarget target = careTargets.get(i);
                List<Call> existing = callRepository.findAllByCareTargetCareTargetIdOrderByStartTimeDesc(target.getCareTargetId());
                int toAdd = Math.max(0, 4 - existing.size());
                for (int k = 0; k < toAdd; k++) {
                    CallStatus status = statuses[k % statuses.length];
                    LocalDateTime startTime = LocalDateTime.now().minusDays(k + 1).withHour(10).withMinute(0).withSecond(0).withNano(0);
                    Integer duration = status == CallStatus.SUCCESS ? ThreadLocalRandom.current().nextInt(60, 421) : 0;
                    LocalDateTime endTime = status == CallStatus.SUCCESS ? startTime.plusSeconds(duration) : null;
                    String callSid = "dum_" + org.getOrganizationId() + "_" + target.getCareTargetId() + "_" + (existing.size() + k + 1);
                    Call call = Call.builder()
                            .organization(org)
                            .careTarget(target)
                            .callSchedule(null)
                            .operatorId(null)
                            .direction(CallDirection.OUTBOUND)
                            .callType(CallType.REGULAR_MONITORING)
                            .status(status)
                            .duration(duration)
                            .startTime(startTime)
                            .endTime(endTime)
                            .summary(status == CallStatus.SUCCESS ? successSummaries[k % successSummaries.length] : summariesByStatus[status.ordinal()])
                            .aiMemo(status == CallStatus.SUCCESS ? "통화 내용 요약 반영됨." : null)
                            .signals(null)
                            .callerId(null)
                            .callSid(callSid)
                            .build();
                    call = callRepository.save(call);
                    if (status == CallStatus.SUCCESS) {
                        String transcript = transcripts[k % transcripts.length];
                        UploadFile file = uploadFileRepository.save(UploadFile.builder()
                                .organization(org)
                                .targetType(UploadTargetType.CALL_LOG)
                                .fileType(UploadFileType.AUDIO)
                                .notice(null)
                                .careTarget(target)
                                .call(call)
                                .originalName("record_" + call.getCallId() + ".mp3")
                                .storagePath("CALL_LOG/" + UUID.randomUUID() + ".mp3")
                                .contentType("audio/mpeg")
                                .fileSize(256000L)
                                .uploadedBy(null)
                                .build());
                        callRecordingRepository.save(CallRecording.builder()
                                .call(call)
                                .file(file)
                                .transcript(transcript)
                                .build());
                        int band = ThreadLocalRandom.current().nextInt(3);
                        int riskScoreValue = band == 0 ? 20 + ThreadLocalRandom.current().nextInt(21)
                                : band == 1 ? 40 + ThreadLocalRandom.current().nextInt(31)
                                : 70 + ThreadLocalRandom.current().nextInt(31);
                        RiskLevel riskLevel = riskScoreValue >= 70 ? RiskLevel.HIGH : riskScoreValue >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW;
                        riskScoreRepository.save(RiskScore.builder()
                                .organization(org)
                                .careTarget(target)
                                .call(call)
                                .riskScore(riskScoreValue)
                                .riskLevel(riskLevel)
                                .calculatedAt(endTime)
                                .build());
                        riskScoreRepository.flush();
                    }
                    created++;
                }
                // Call은 스킵됐어도(기존 걸 쓰는 경우) 해당 대상자의 기존 Call에 RiskScore 없으면 추가
                for (Call existingCall : existing) {
                    if (riskScoreRepository.findFirstByCall_CallIdOrderByCalculatedAtDesc(existingCall.getCallId()).isPresent()) {
                        continue;
                    }
                    LocalDateTime calculatedAt = existingCall.getEndTime() != null ? existingCall.getEndTime() : existingCall.getStartTime();
                    if (calculatedAt == null) calculatedAt = LocalDateTime.now();
                    int band = ThreadLocalRandom.current().nextInt(3);
                    int riskScoreValue = band == 0 ? 20 + ThreadLocalRandom.current().nextInt(21)
                            : band == 1 ? 40 + ThreadLocalRandom.current().nextInt(31)
                            : 70 + ThreadLocalRandom.current().nextInt(31);
                    RiskLevel riskLevel = riskScoreValue >= 70 ? RiskLevel.HIGH : riskScoreValue >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW;
                    riskScoreRepository.save(RiskScore.builder()
                            .organization(org)
                            .careTarget(target)
                            .call(existingCall)
                            .riskScore(riskScoreValue)
                            .riskLevel(riskLevel)
                            .calculatedAt(calculatedAt)
                            .build());
                    riskScoreRepository.flush();
                }
            }
        }
        log.info("Call 처리 완료: 신규 {}건 (SUCCESS/FAILED/NO_ANSWER/CANCELLED 골고루, SUCCESS만 Recording·RiskScore)", created);
    }

    /**
     * RiskScore 추이용: 케어대상별로 전화 주기가 다르다고 가정.
     * - 일별 1회(매일), 3일마다 1회, 주 1회 패턴으로 과거 일자에 RiskScore 생성 (call=null).
     * 그래프는 일자별 최신 1건을 쓰므로 각 일자에 1개씩 쌓이도록 함.
     */
    private void insertRiskScoreTrends(List<Organization> orgs) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime rangeStart = now.minusDays(35);
        int created = 0;
        for (Organization org : orgs) {
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            if (careTargets.isEmpty()) continue;
            List<RiskScore> allInRange = riskScoreRepository.findAll().stream()
                    .filter(rs -> rs.getCalculatedAt() != null && !rs.getCalculatedAt().isBefore(rangeStart))
                    .toList();
            for (int i = 0; i < careTargets.size(); i++) {
                CareTarget target = careTargets.get(i);
                long existingInRange = allInRange.stream()
                        .filter(rs -> rs.getCareTarget().getCareTargetId().equals(target.getCareTargetId()))
                        .count();
                // 패턴: 0=매일(30건), 1=3일마다(~10건), 2=주 1회(5건)
                int pattern = i % 3;
                int needCount = pattern == 0 ? 30 : pattern == 1 ? 10 : 5;
                if (existingInRange >= needCount) {
                    log.debug("기존 RiskScore 추이 충분: careTargetId={} ({}건)", target.getCareTargetId(), existingInRange);
                    continue;
                }
                int[] dayOffsets = pattern == 0
                        ? new int[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29 }
                        : pattern == 1
                        ? new int[] { 0, 3, 6, 9, 12, 15, 18, 21, 24, 27 }
                        : new int[] { 0, 7, 14, 21, 28 };
                for (int dayOffset : dayOffsets) {
                    LocalDateTime calculatedAt = now.minusDays(dayOffset).withHour(10).withMinute(0).withSecond(0).withNano(0);
                    int band = ThreadLocalRandom.current().nextInt(3);
                    int riskScoreValue = band == 0 ? 20 + ThreadLocalRandom.current().nextInt(21)
                            : band == 1 ? 40 + ThreadLocalRandom.current().nextInt(31)
                            : 70 + ThreadLocalRandom.current().nextInt(31);
                    RiskLevel riskLevel = riskScoreValue >= 70 ? RiskLevel.HIGH : riskScoreValue >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW;
                    riskScoreRepository.save(RiskScore.builder()
                            .organization(org)
                            .careTarget(target)
                            .call(null)
                            .riskScore(riskScoreValue)
                            .riskLevel(riskLevel)
                            .calculatedAt(calculatedAt)
                            .build());
                    created++;
                }
                log.debug("RiskScore 추이: careTargetId={} 패턴={} ({}일자)", target.getCareTargetId(), pattern == 0 ? "매일" : pattern == 1 ? "3일마다" : "주1회", needCount);
            }
        }
        log.info("RiskScore 추이 처리 완료: 신규 {}건 (케어대상별 매일/3일마다/주1회)", created);
    }

    /** Notification: 업체당 6건. Organization, User(또는 공유), CareTarget/Call 연동. 있으면 건너뜀(조직 알림 수로 판단) */
    private void insertNotifications(List<Organization> orgs) {
        NotificationType[] types = { NotificationType.RISK_DETECTION, NotificationType.CALL, NotificationType.SCHEDULE, NotificationType.MEDICATION, NotificationType.VITAL_SIGN, NotificationType.OTHER };
        RiskLevel[] severities = { RiskLevel.LOW, RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL };
        String[] titles = {
                "위험 점수 상승 알림",
                "정기 통화 완료",
                "다음 통화 일정 안내",
                "복약 확인 알림",
                "생체 신호 이상 감지",
                "기타 알림"
        };
        String[] descriptions = {
                "해당 케어대상의 위험 점수가 상승했습니다. 확인 부탁드립니다.",
                "정기 건강 확인 통화가 완료되었습니다.",
                "다음 주 목요일 오후 3시 통화 예정입니다.",
                "오늘 복약 여부를 확인해 주세요.",
                "혈압/혈당 수치가 설정 범위를 벗어났습니다.",
                "추가 확인이 필요한 사항이 있습니다."
        };
        NotificationStatus[] statuses = { NotificationStatus.ACTIVE, NotificationStatus.ACTIVE, NotificationStatus.RESOLVED, NotificationStatus.ACTIVE, NotificationStatus.PROCESSING, NotificationStatus.ACTIVE };
        int created = 0;
        for (Organization org : orgs) {
            List<User> users = userRepository.findByOrganization(org);
            User assignee = users.isEmpty() ? null : users.get(0);
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            CareTarget firstTarget = careTargets.isEmpty() ? null : careTargets.get(0);
            List<Call> calls = firstTarget != null ? callRepository.findAllByCareTargetCareTargetIdOrderByStartTimeDesc(firstTarget.getCareTargetId()) : List.of();
            Call firstCall = calls.isEmpty() ? null : calls.get(0);
            long existingCount = assignee != null ? notificationRepository.countByOrganizationIdAndUserIdOrSharedAndStatus(org.getOrganizationId(), assignee.getUserId(), NotificationStatus.ACTIVE)
                    + notificationRepository.countByOrganizationIdAndUserIdOrSharedAndStatus(org.getOrganizationId(), assignee.getUserId(), NotificationStatus.RESOLVED)
                    : 0;
            if (existingCount >= 6) {
                log.debug("기존 Notification 충분: {} ({}건)", org.getName(), existingCount);
                continue;
            }
            for (int i = 0; i < 6; i++) {
                Notification noti = Notification.builder()
                        .organization(org)
                        .careTarget(firstTarget)
                        .call(i == 1 ? firstCall : null)
                        .user(i % 2 == 0 ? assignee : null)
                        .severity(severities[i])
                        .title(titles[i])
                        .description(descriptions[i])
                        .type(types[i])
                        .status(statuses[i])
                        .occurredAt(LocalDateTime.now().minusHours(i + 1))
                        .resolvedAt(statuses[i] == NotificationStatus.RESOLVED ? LocalDateTime.now().minusMinutes(30) : null)
                        .resolvedBy(null)
                        .build();
                notificationRepository.save(noti);
                created++;
            }
            log.info("Notification 생성: {} - 6건", org.getName());
        }
        log.info("Notification 처리 완료: 신규 {}건", created);
    }

    /** Task: 업체당 11건. Organization, CareTarget, User, (optional) Call/Schedule/Notification. USER/AI 타입, 상태(대기/진행/완료) 골고루 */
    private void insertTasks(List<Organization> orgs) {
        int created = 0;
        TaskType[] types = { TaskType.CARE, TaskType.RISK_FOLLOWUP, TaskType.OTHER, TaskType.CALL_INIT, TaskType.SCHEDULE_CHANGE, TaskType.RISK_ALERT, TaskType.AUTOMATION };
        String[] titles = {
                "정기 건강 확인 후속 조치",
                "위험 점수 상승 환자 확인",
                "통화 일정 조정",
                "스케줄 변경 요청 처리",
                "위험 알림 후속 대응",
                "자동 생성 할일 확인",
                "케어 대상 방문 일정 확인",
                "복약 확인 연락",
                "통화 실패 재시도",
                "고위험 환자 주간 점검",
                "기타 업무"
        };
        String[] descriptions = {
                "정기 통화 결과에 따른 후속 조치가 필요합니다.",
                "위험 점수가 상승한 케어대상을 확인해 주세요.",
                "요청에 따라 통화 일정을 조정해 주세요.",
                "스케줄 변경 요청을 반영해 주세요.",
                "위험 알림에 대한 후속 대응을 진행해 주세요.",
                "자동 생성된 할일을 확인하고 처리해 주세요.",
                "케어 대상 방문 일정을 확인해 주세요.",
                "복약 여부 확인 연락을 진행해 주세요.",
                "통화 연결 실패 건에 대해 재시도해 주세요.",
                "고위험 환자 주간 점검을 진행해 주세요.",
                "추가 확인이 필요한 업무입니다."
        };
        LocalDateTime now = LocalDateTime.now();
        for (Organization org : orgs) {
            List<Task> existing = taskRepository.findByOrganizationAndFilters(org.getOrganizationId(), null, null, null, null, null);
            if (existing.size() >= 11) {
                log.debug("기존 Task 충분: {} ({}건)", org.getName(), existing.size());
                continue;
            }
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            List<User> users = userRepository.findByOrganization(org);
            if (careTargets.isEmpty() || users.isEmpty()) continue;
            CareTarget target0 = careTargets.get(0);
            List<Call> calls = callRepository.findAllByCareTargetCareTargetIdOrderByStartTimeDesc(target0.getCareTargetId());
            List<CallSchedule> schedules = callScheduleRepository.findIndividualSchedulesByCareTargetAndStatus(target0, ScheduleStatus.SCHEDULED);
            List<CareTargetGroup> groups = careTargetGroupRepository.findAllByOrgId(org.getOrganizationId());
            if (!groups.isEmpty()) {
                schedules = new ArrayList<>(schedules);
                schedules.addAll(callScheduleRepository.findAllByGroupIdAndOrgId(groups.get(0).getGroupId(), org.getOrganizationId()));
            }
            List<Notification> notifications = users.isEmpty() ? List.of()
                    : notificationRepository.findByOrganizationIdAndUserIdOrShared(org.getOrganizationId(), users.get(0).getUserId());
            User assignee = users.get(0);
            // 11건: USER 6 (WAITING 2, PROGRESS 2, DONE 2), AI 5 (WAITING 1, SUCCESS 2, FAILED 2)
            TaskSourceType[] sourceTypes = { TaskSourceType.USER, TaskSourceType.USER, TaskSourceType.USER, TaskSourceType.USER, TaskSourceType.USER, TaskSourceType.USER,
                    TaskSourceType.AI, TaskSourceType.AI, TaskSourceType.AI, TaskSourceType.AI, TaskSourceType.AI };
            TaskStatus[] statuses = {
                    TaskStatus.WAITING, TaskStatus.WAITING, TaskStatus.PROGRESS, TaskStatus.PROGRESS, TaskStatus.DONE, TaskStatus.DONE,
                    TaskStatus.WAITING, TaskStatus.SUCCESS, TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.FAILED
            };
            for (int i = 0; i < 11; i++) {
                CareTarget target = careTargets.get(i % careTargets.size());
                Call call = (i == 2 || i == 8) && !calls.isEmpty() ? calls.get(0) : null;
                CallSchedule schedule = (i == 3 || i == 7) && !schedules.isEmpty() ? schedules.get(0) : null;
                Notification notification = (i == 4 || i == 9) && !notifications.isEmpty() ? notifications.get(0) : null;
                LocalDateTime due = now.plusDays(i + 1);
                LocalDateTime completedAt = (statuses[i] == TaskStatus.DONE || statuses[i] == TaskStatus.SUCCESS || statuses[i] == TaskStatus.FAILED)
                        ? now.minusHours(11 - i) : null;
                Task task = Task.builder()
                        .organization(org)
                        .sourceType(sourceTypes[i])
                        .careTarget(target)
                        .title(titles[i % titles.length])
                        .description(descriptions[i % descriptions.length])
                        .type(types[i % types.length])
                        .priority(Priority.MEDIUM)
                        .status(statuses[i])
                        .createdBy(assignee)
                        .assignedTo(assignee)
                        .dueDate(due)
                        .completedAt(completedAt)
                        .call(i == 2 || i == 8 ? call : null)
                        .schedule(i == 3 || i == 7 ? schedule : null)
                        .notification(i == 4 || i == 9 ? notification : null)
                        .result(statuses[i] == TaskStatus.DONE || statuses[i] == TaskStatus.SUCCESS ? "처리 완료되었습니다." : null)
                        .startedAt(statuses[i] == TaskStatus.PROGRESS || statuses[i] == TaskStatus.DONE ? now.minusHours(2) : null)
                        .build();
                taskRepository.save(task);
                created++;
            }
            log.info("Task 생성: {} - 11건 (USER/AI, 대기·진행·완료 골고루)", org.getName());
        }
        log.info("Task 처리 완료: 신규 {}건", created);
    }

    /** Notice: 업체당 5건. Organization, User. Comment: 공지당 0~3건, 일부 대댓글. 있으면 건너뜀 */
    private void insertNoticesAndComments(List<Organization> orgs) {
        int noticesCreated = 0;
        int commentsCreated = 0;
        String[] titles = {
                "정기 건강 확인 일정 안내",
                "시스템 점검 및 이용 안내",
                "케어 대상자 관리 매뉴얼 업데이트",
                "긴급: 야간 통화 제한 시간 변경",
                "월간 실적 및 공지사항"
        };
        String[] contents = {
                "다음 주 정기 건강 확인 통화 일정을 확인해 주시기 바랍니다. 변경이 필요하시면 담당자에게 연락 부탁드립니다.",
                "일요일 새벽 2시~4시 시스템 점검이 예정되어 있습니다. 해당 시간에는 서비스 이용이 제한될 수 있습니다.",
                "케어 대상자 관리 매뉴얼이 개정되었습니다. 최신 버전을 확인해 주세요.",
                "야간 통화 제한 시간이 22:00~07:00로 변경됩니다. 시행일은 다음 월요일부터입니다.",
                "이번 달 실적 요약과 함께 공지사항을 전달드립니다. 문의사항은 관리자에게 연락 주세요."
        };
        String[] commentContents = {
                "확인했습니다. 감사합니다.",
                "일정 변경 요청드립니다.",
                "내용 잘 읽었습니다.",
                "추가 문의 드립니다.",
                "반영 부탁드립니다.",
                "네, 알겠습니다."
        };
        for (Organization org : orgs) {
            long noticeCount = noticeRepository.findAll().stream()
                    .filter(n -> n.getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .count();
            if (noticeCount >= 5) {
                log.debug("기존 Notice 충분: {} (5건 이상)", org.getName());
                continue;
            }
            List<User> users = userRepository.findByOrganization(org);
            if (users.isEmpty()) continue;
            User writer = users.get(0);
            for (int i = 0; i < 5; i++) {
                Notice notice = Notice.builder()
                        .organization(org)
                        .user(writer)
                        .title(titles[i])
                        .content(contents[i])
                        .viewCount(ThreadLocalRandom.current().nextInt(0, 50))
                        .isPinned(i == 0 || i == 3)
                        .isDeleted(false)
                        .build();
                notice = noticeRepository.save(notice);
                noticesCreated++;
                // 공지당 댓글 0~3개 (첫 공지는 3개, 나머지 골고루)
                int commentCount = i == 0 ? 3 : (i == 1 || i == 2 ? 2 : 1);
                NoticeComment parentComment = null;
                for (int c = 0; c < commentCount; c++) {
                    User commenter = users.get(c % users.size());
                    boolean isReply = (i == 0 && c == 2); // 첫 공지의 세 번째 댓글은 대댓글
                    NoticeComment comment = NoticeComment.builder()
                            .notice(notice)
                            .parentComment(isReply ? parentComment : null)
                            .user(commenter)
                            .content(commentContents[(i + c) % commentContents.length])
                            .isDeleted(false)
                            .build();
                    comment = noticeCommentRepository.save(comment);
                    commentsCreated++;
                    if (c == 1) parentComment = comment;
                }
            }
            log.info("Notice·Comment 생성: {} - 공지 5건, 댓글 다수", org.getName());
        }
        log.info("Notice 처리 완료: 신규 공지 {}건, 댓글 {}건", noticesCreated, commentsCreated);
    }

    /** InboundSms: 업체당 5건. CareTarget(fromNumber=대상자 전화), smsType 골고루. OutboundSms: 업체당 5건, toNumber=대상자 전화, SentBy USER/AI. 있으면 건너뜀 */
    private void insertInboundAndOutboundSms(List<Organization> orgs) {
        final String dummyInboundPrefix = "dum_in_";
        final String dummyOutboundPrefix = "dum_out_";
        final String testToNumber = "01000000000";
        final String testFromNumber = "0212345678";
        int inboundCreated = 0;
        int outboundCreated = 0;
        SmsType[] smsTypes = { SmsType.SMS_AI_MEMO, SmsType.SCHEDULE_CHANGE, SmsType.PRESCRIPTION, SmsType.UNKNOWN, SmsType.SMS_AI_MEMO };
        String[] inboundBodies = {
                "다음 주 목요일 오후 3시로 통화 일정 변경 부탁드려요.",
                "오늘 컨디션 좋아요. 특이사항 없습니다.",
                "처방전 이미지 보내드립니다. 확인 부탁드려요.",
                "건강 확인 통화 잘 받았습니다. 감사해요.",
                "약 복용 잘 하고 있어요."
        };
        String[] outboundBodies = {
                "[케어파일럿] 정기 건강 확인 통화 안내입니다. 문의사항은 담당자에게 연락 주세요.",
                "[케어파일럿] 다음 통화 일정은 12월 15일 오후 2시입니다.",
                "[케어파일럿] 야간 통화 제한 시간은 22시~07시입니다.",
                "[케어파일럿] 복약 확인 연락드립니다. 오늘 약 드셨나요?",
                "[케어파일럿] 위험 점수 상승 알림이 있습니다. 확인 부탁드립니다."
        };
        LocalDateTime now = LocalDateTime.now();
        for (Organization org : orgs) {
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            if (careTargets.isEmpty()) continue;
            long inboundCount = inboundSmsRepository.findAll().stream()
                    .filter(s -> s.getCareTarget() != null
                            && s.getCareTarget().getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .count();
            if (inboundCount >= 5) {
                log.debug("기존 InboundSms 충분: {} (5건 이상)", org.getName());
            } else {
                for (int i = 0; i < 5; i++) {
                    CareTarget target = careTargets.get(i % careTargets.size());
                    String fromNumber = target.getTargetPhone() != null ? target.getTargetPhone() : "01011112222";
                    InboundSms inbound = InboundSms.builder()
                            .messageSid(dummyInboundPrefix + org.getOrganizationId() + "_" + i)
                            .fromNumber(fromNumber)
                            .toNumber(testToNumber)
                            .body(inboundBodies[i])
                            .mediaPaths(null)
                            .mediaContentTypes(null)
                            .careTarget(target)
                            .smsType(smsTypes[i])
                            .classificationAt(now.minusHours(i + 1))
                            .build();
                    inboundSmsRepository.save(inbound);
                    inboundCreated++;
                }
                log.info("InboundSms 생성: {} - 5건 (CareTarget, smsType 골고루)", org.getName());
            }
            int outboundPerOrg = 5;
            String outboundPrefixForOrg = dummyOutboundPrefix + org.getOrganizationId() + "_";
            long outboundCount = outboundSmsRepository.findAll().stream()
                    .filter(s -> s.getMessageSid() != null && s.getMessageSid().startsWith(outboundPrefixForOrg))
                    .count();
            if (outboundCount >= outboundPerOrg) {
                log.debug("기존 OutboundSms 충분: {} (5건 이상)", org.getName());
            } else {
                for (int i = 0; i < outboundPerOrg; i++) {
                    CareTarget target = careTargets.get(i % careTargets.size());
                    String toNumber = target.getTargetPhone() != null ? target.getTargetPhone() : "01033334444";
                    OutboundSms outbound = OutboundSms.builder()
                            .messageSid(outboundPrefixForOrg + i)
                            .fromNumber(testFromNumber)
                            .toNumber(toNumber)
                            .body(outboundBodies[i])
                            .sentBy(i % 2 == 0 ? SentBy.USER : SentBy.AI)
                            .build();
                    outboundSmsRepository.save(outbound);
                    outboundCreated++;
                }
                log.info("OutboundSms 생성: {} - 5건 (CareTarget toNumber, USER/AI 골고루)", org.getName());
            }
        }
        log.info("InboundSms·OutboundSms 처리 완료: 신규 수신 {}건, 발신 {}건", inboundCreated, outboundCreated);
    }

    /** Prescription 처방전 이력: 업체당 5건. CareTarget, UploadFile(INBOUND_SMS/IMAGE), optional InboundSms(PRESCRIPTION). 있으면 건너뜀 */
    private void insertPrescriptions(List<Organization> orgs) {
        int created = 0;
        LocalDateTime now = LocalDateTime.now();
        String[] diagnosesTemplates = {
                "[{\"name\":\"본태성 고혈압\",\"icdCode\":\"I10\"},{\"name\":\"제2형 당뇨병\",\"icdCode\":\"E11\"}]",
                "[{\"name\":\"퇴행성 관절염\",\"icdCode\":\"M17\"}]",
                "[{\"name\":\"불면증\",\"icdCode\":\"G47.0\"},{\"name\":\"우울증\",\"icdCode\":\"F32\"}]",
                "[{\"name\":\"심부전\",\"icdCode\":\"I50\"}]",
                "[{\"name\":\"갑상선 기능 저하증\",\"icdCode\":\"E03\"}]"
        };
        String[] medicationsTemplates = {
                "[{\"name\":\"압료디민정 5mg\",\"dosage\":\"1회 1정\",\"frequency\":\"1일 1회\",\"timing\":\"아침 식후\",\"duration\":\"30일분\"},{\"name\":\"메트포민 500mg\",\"dosage\":\"1회 1정\",\"frequency\":\"1일 2회\",\"timing\":\"아침·저녁 식후\",\"duration\":\"30일분\"}]",
                "[{\"name\":\"타이레놀정\",\"dosage\":\"1회 2정\",\"frequency\":\"1일 3회\",\"timing\":\"식후\",\"duration\":\"7일분\"}]",
                "[{\"name\":\"졸피뎀정 10mg\",\"dosage\":\"1회 1정\",\"frequency\":\"1일 1회\",\"timing\":\"취침 전\",\"duration\":\"14일분\"}]",
                "[{\"name\":\"라녹스정 0.125mg\",\"dosage\":\"1회 1정\",\"frequency\":\"1일 1회\",\"timing\":\"아침\",\"duration\":\"30일분\"}]",
                "[{\"name\":\"레보티록신나트륨 50mcg\",\"dosage\":\"1회 1정\",\"frequency\":\"1일 1회\",\"timing\":\"공복\",\"duration\":\"30일분\"}]"
        };
        String[] summaries = {
                "고혈압·당뇨 유지 처방. 약 규칙 복용 권고.",
                "관절염 완화제 처방. 통증 시 복용.",
                "수면·우울 관련 처방. 2주 후 재평가.",
                "심부전 유지 처방. 염분 제한 권고.",
                "갑상선 호르몬 보충. 정기 검사 권고."
        };
        for (Organization org : orgs) {
            long prescriptionCount = prescriptionRepository.findAll().stream()
                    .filter(p -> p.getCareTarget().getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .count();
            if (prescriptionCount >= 5) {
                log.debug("기존 Prescription 충분: {} (5건 이상)", org.getName());
                continue;
            }
            List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(org.getOrganizationId(), null);
            if (careTargets.isEmpty()) continue;
            List<InboundSms> prescriptionInbounds = inboundSmsRepository.findAll().stream()
                    .filter(s -> s.getSmsType() == SmsType.PRESCRIPTION
                            && s.getCareTarget() != null
                            && s.getCareTarget().getOrganization().getOrganizationId().equals(org.getOrganizationId()))
                    .toList();
            for (int i = 0; i < 5; i++) {
                CareTarget target = careTargets.get(i % careTargets.size());
                UploadFile file = uploadFileRepository.save(UploadFile.builder()
                        .organization(org)
                        .targetType(UploadTargetType.INBOUND_SMS)
                        .fileType(UploadFileType.IMAGE)
                        .careTarget(target)
                        .originalName("prescription_" + org.getOrganizationId() + "_" + i + ".jpg")
                        .storagePath("INBOUND_SMS/" + target.getCareTargetId() + "/" + UUID.randomUUID() + ".jpg")
                        .contentType("image/jpeg")
                        .fileSize(128000L)
                        .uploadedBy(null)
                        .build());
                InboundSms linkedInbound = (i == 0 && !prescriptionInbounds.isEmpty()) ? prescriptionInbounds.get(0) : null;
                Prescription prescription = Prescription.builder()
                        .careTarget(target)
                        .uploadFile(file)
                        .inboundSms(linkedInbound)
                        .prescribedDate(LocalDate.now().minusDays(i + 10))
                        .rawOcrText("처방전 OCR 원문 " + (i + 1) + ": 의료기관명 " + org.getName() + ", 환자명 " + target.getName() + ", 처방일 등.")
                        .diagnoses(diagnosesTemplates[i])
                        .medications(medicationsTemplates[i])
                        .summary(summaries[i])
                        .analyzedAt(now.minusDays(i + 1))
                        .build();
                prescriptionRepository.save(prescription);
                created++;
            }
            log.info("Prescription 생성: {} - 5건 (CareTarget, UploadFile, 처방 이력)", org.getName());
        }
        log.info("Prescription 처리 완료: 신규 {}건", created);
    }
}
