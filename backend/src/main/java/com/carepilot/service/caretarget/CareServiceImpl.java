package com.carepilot.service.caretarget;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.*;
import com.carepilot.dto.config.RiskConfigDTO;
import com.carepilot.dto.upload.TargetFileDTO;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import com.carepilot.domain.prescription.Prescription;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.DoctorRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.prescription.PrescriptionRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.carepilot.service.config.risk.RiskConfigService;
import com.carepilot.service.upload.UploadFileService;
import org.springframework.transaction.annotation.Transactional; // 1. 임포트 확인!
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StopWatch;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareServiceImpl implements CareService {

    private final CareTargetRepository careTargetRepository;
    private final OrganizationRepository organizationRepository;
    private final DoctorRepository doctorRepository;
    private final UploadFileService uploadFileService;
    private final CallRepository callRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final CareTargetGroupMapRepository careTargetGroupMapRepository;
    private final RiskConfigService riskConfigService;
    private final UploadFileRepository uploadFileRepository;
    private final PrescriptionRepository prescriptionRepository;

    //대량 환자등록 ---------------------------------------------------------------------------
    @Override
    @Transactional
    public List<CareTargetListResponseDTO> csvOrExcelCareTargetSave(List<CareTargetInsertRequestDTO> requests) {

        Organization organization = organizationRepository.findById(requests.get(0).getOrganizationId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조직입니다."));

        log.info("대량 등록 서비스 진입 - 건수: {}", requests.size());

        for (CareTargetInsertRequestDTO dto : requests) {
            Doctor doctor = null;
            if (dto.getDoctorId() != null) {
                doctor = doctorRepository.findById(dto.getDoctorId()).orElse(null);
            }

            CareTarget ct = CareTarget.builder()
                    .organization(organization)
                    .name(dto.getName())
                    .age(dto.getAge())
                    .gender(dto.getGender())
                    .disease(dto.getDisease())
                    .targetPhone(dto.getTargetPhone())
                    .guardianName(dto.getGuardianName())
                    .guardianPhone(dto.getGuardianPhone())
                    .guardianRelationship(dto.getGuardianRelationship())
                    .doctor(doctor)
                    .build();

            log.info("저장중: {}", dto.getName());
            careTargetRepository.save(ct);
        }

        log.info("대량 등록 완료");
        return getCareTargetList(organization.getOrganizationId(), "");
    }
    //END-------------------------------------------------------------------------------------------

    //수동 환자등록----------------------------------------------------------------------------------
    @Override
    @Transactional
    public List<CareTargetListResponseDTO> careTargetInsert(CareTargetInsertRequestDTO careTargetInsertRequestDTO, List<MultipartFile> files) {

        log.info("서비스 진입 수동등록");

        Doctor doctor = null;
        if (careTargetInsertRequestDTO.getDoctorId() != null){
            doctor = doctorRepository.findById(careTargetInsertRequestDTO.getDoctorId()).orElse(null);
        }

        Organization organization = organizationRepository.findById(careTargetInsertRequestDTO.getOrganizationId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조직입니다."));

        CareTarget ct = CareTarget.builder()
                .organization(organization)
                .name(careTargetInsertRequestDTO.getName())
                .age(careTargetInsertRequestDTO.getAge())
                .gender(careTargetInsertRequestDTO.getGender())
                .disease(careTargetInsertRequestDTO.getDisease())
                .targetPhone(careTargetInsertRequestDTO.getTargetPhone())
                .guardianName(careTargetInsertRequestDTO.getGuardianName())
                .guardianPhone(careTargetInsertRequestDTO.getGuardianPhone())
                .guardianRelationship(careTargetInsertRequestDTO.getGuardianRelationship())
                .doctor(doctor) //null or 의료진
                .build();

        CareTarget result = careTargetRepository.save(ct);

        TargetFileDTO dto = TargetFileDTO.builder()
                .targetType(UploadTargetType.CARE_TARGET)
                .targetId(result.getCareTargetId())
                .organizationId(careTargetInsertRequestDTO.getOrganizationId())
                .files(files)
                .build();

        List<UploadFileResponseDTO> fileResult = uploadFileService.saveFiles(dto);

        log.info("저장성공 수동등록");

        return getCareTargetList(careTargetInsertRequestDTO.getOrganizationId(), "");


    }
    //END-------------------------------------------------------------------------------------------

    //전체조회 리스트-----------------------------------------------------------------------------------
    @Override
    public List<CareTargetListResponseDTO> getCareTargetList(Long organizationId, String keyword) {

        List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(organizationId, keyword);
        List<Long> careTargetIds = careTargets.stream()
                .map(CareTarget::getCareTargetId)
                .toList();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        RiskConfigDTO riskConfig = riskConfigService.getRiskConfig(organizationId);

        List<Call> latestCalls = callRepository.findLatestCallsByCareTargetIds(careTargetIds);
        Map<Long, Call> latestCallsMap = latestCalls.stream()
                .collect(Collectors.toMap(
                        call -> call.getCareTarget().getCareTargetId(),
                        call -> call,
                        (existing, replacement) -> existing // 중복 시 기존 값 유지
                ));
        
        List<RiskScore> latestRiskScores = riskScoreRepository.findLatestRiskScoresByCareTargetIds(careTargetIds);
        Map<Long, RiskScore> latestRiskScoresMap = latestRiskScores.stream()
                .collect(Collectors.toMap(
                        rs -> rs.getCareTarget().getCareTargetId(),
                        rs -> rs,
                        (existing, replacement) -> existing // 중복 시 기존 값 유지
                ));

        List<CareTargetListResponseDTO> result = new ArrayList<>();
        
        for (CareTarget ct : careTargets) {
            Call lastCall = latestCallsMap.get(ct.getCareTargetId());
            String lastCallDate = lastCall != null 
                ? lastCall.getStartTime().format(formatter) 
                : null;
            
            RiskScore latestRiskScore = latestRiskScoresMap.get(ct.getCareTargetId());
            RiskLevel latestLevel = latestRiskScore != null
                ? riskConfigService.resolveLevel(latestRiskScore.getRiskScore(), riskConfig)
                : RiskLevel.LOW;
            
            // 위험도 점수 및 계산 시간
            int riskScoreValue = latestRiskScore != null && latestRiskScore.getRiskScore() != null
                ? latestRiskScore.getRiskScore()
                : 0;
            LocalDateTime riskCalculatedAt = latestRiskScore != null
                ? latestRiskScore.getCalculatedAt()
                : null;
            
            List<UploadFileResponseDTO> tempfiles = uploadFileService.careTargetFiles(organizationId, ct.getCareTargetId());
            List<UploadFileResponseDTO> filesScores = (tempfiles != null && !tempfiles.isEmpty())
                    ? tempfiles
                    : null;
            
            CareTargetListResponseDTO dto = CareTargetListResponseDTO.builder()
                    .careTargetId(ct.getCareTargetId())
                    .thumbnailStoragePath(filesScores != null ? filesScores.getFirst().getThumbnailUrl() : null)
                    .name(ct.getName())
                    .age(ct.getAge())
                    .gender(ct.getGender())
                    .careTargetPhone(ct.getTargetPhone())
                    .disease(ct.getDisease())
                    .riskScore(riskScoreValue)
                    .riskLevel(latestLevel)
                    .recentCall(lastCallDate)
                    .riskCalculatedAt(riskCalculatedAt)
                    .build();
            result.add(dto);
        }

        return result;
    }


    @Override
    public List<CareTargetDoctorResponseDTO> getDoctorList(Long organizationId) {

        try {
            // 레포지토리 호출
            List<CareTargetDoctorResponseDTO> doctorList = doctorRepository.findDoctorsByOrganization(organizationId);
            if (doctorList == null || doctorList.isEmpty()) {
                log.warn("조직 ID {} : 등록된 의료진 정보가 없습니다.", organizationId);
                return Collections.emptyList();
            }

            return doctorList;

        } catch (Exception e) {
            // 예기치 못한 데이터베이스 오류 등 시스템 에러 처리
            log.error("의료진 목록 조회 중 에러 발생 (조직ID: {}): {}", organizationId, e.getMessage());
            throw new RuntimeException("의료진 정보를 불러오는 중 서버 오류가 발생했습니다.");
        }
    }




    //케어 대상자 상세 조회--------------------------------------------------


    @Override
    public CareTargetDetailResponseDTO getCareTargetDetail(Long organizationId, Long careTargetId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        CareTarget careTarget = careTargetRepository.findById(careTargetId).orElseThrow();

        // 1. 통화 기록 가져오기 및 최신순 정렬 (Repository 레벨에서 정렬 권장)
        List<Call> calls = callRepository.findAllByCareTargetCareTargetIdOrderByStartTimeDesc(careTargetId);

        // 2. 최신 AI 메모 안전하게 가져오기
        String latestAiMemo = calls.stream()
                .findFirst()
                .map(Call::getAiMemo)
                .orElse(null);

        // 3. 통화 히스토리 변환 (빈 리스트일 경우 null 대신 빈 리스트 반환이 프론트엔드에서 처리하기 편함)
        List<CallHistoryDTO> callHistoryDTOS = calls.stream()
                .map(c -> CallHistoryDTO.builder()
                        .callType(c.getCallType() != null ? c.getCallType().name() : null)
                        .startTime(c.getStartTime().format(formatter))
                        .summary(c.getSummary())
                        .status(c.getStatus() != null ? c.getStatus().name() : null)
                        .build())
                .toList();

        // 4. 파일 정보 처리 (Empty 체크 추가)
        List<UploadFileResponseDTO> tempFiles = uploadFileService.careTargetFiles(organizationId, careTargetId);
        String firstFileUrl = (tempFiles != null && !tempFiles.isEmpty())
                ? tempFiles.get(0).getFileUrl()
                : null;

        // 5. 위험도 추이: 일별 최신 1건만 사용, 최근 14개 일자만
        List<RiskScore> dbScores = riskScoreRepository.findTrendData(careTargetId, LocalDateTime.now().minusMonths(6));
        Map<LocalDate, RiskScore> latestPerDay = new LinkedHashMap<>();
        for (RiskScore rs : dbScores) {
            if (rs.getCalculatedAt() == null) continue;
            LocalDate d = rs.getCalculatedAt().toLocalDate();
            latestPerDay.merge(d, rs, (a, b) -> a.getCalculatedAt().isAfter(b.getCalculatedAt()) ? a : b);
        }

        List<RiskTrendDTO> trendList = latestPerDay.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, RiskScore>comparingByKey().reversed())
                .limit(14)
                .map(Map.Entry::getValue)
                .sorted(Comparator.comparing(RiskScore::getCalculatedAt))
                .map(rs -> new RiskTrendDTO(
                        rs.getRiskScore() != null ? rs.getRiskScore() : 0,
                        rs.getCalculatedAt().toLocalDate().format(formatter),
                        null,
                        null
                ))
                .toList();

        // 6. 처방 이력 (최신순)
        List<Prescription> prescriptions = prescriptionRepository.findByCareTarget_CareTargetIdOrderByAnalyzedAtDesc(careTargetId);
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<PrescriptionHistoryDTO> prescriptionHistoryDTOS = prescriptions.stream()
                .map(p -> {
                    UploadFile uf = p.getUploadFile();
                    String storagePath = (uf != null) ? uf.getStoragePath() : null;
                    String imageFileUrl = (storagePath != null && !storagePath.isBlank())
                            ? "/display/" + storagePath.trim()
                            : null;
                    return PrescriptionHistoryDTO.builder()
                            .prescriptionId(p.getPrescriptionId())
                            .prescribedDate(p.getPrescribedDate() != null ? p.getPrescribedDate().format(formatter) : null)
                            .summary(p.getSummary())
                            .diagnoses(p.getDiagnoses())
                            .medications(p.getMedications())
                            .analyzedAt(p.getAnalyzedAt() != null ? p.getAnalyzedAt().format(dateTimeFormatter) : null)
                            .imageFileUrl(imageFileUrl)
                            .build();
                })
                .toList();

        // 7. 의사 정보 및 최종 빌드
        CareTargetDoctorResponseDTO doctor = Optional.ofNullable(careTarget.getDoctor())
                .map(d -> CareTargetDoctorResponseDTO.builder()
                        .doctorId(d.getDoctorId())
                        .doctorName(d.getName())
                        .doctorSpecialty(d.getSpecialty())
                        .build())
                .orElse(null);

        return CareTargetDetailResponseDTO.builder()
                .file(firstFileUrl) // 안전하게 추출한 URL
                .name(careTarget.getName())
                .age(careTarget.getAge())
                .gender(careTarget.getGender())
                .disease(careTarget.getDisease())
                .targetPhone(careTarget.getTargetPhone())
                .careTargetDoctorResponseDTO(doctor)
                .guardianName(careTarget.getGuardianName())
                .guardianPhone(careTarget.getGuardianPhone())
                .guardianRelationship(careTarget.getGuardianRelationship())
                .aiMemo(latestAiMemo)
                .riskTrendDTOS(trendList)
                .callHistoryDTOS(callHistoryDTOS)
                .prescriptionHistoryDTOS(prescriptionHistoryDTOS)
                .build();
    }




    //--------------------------------------
    @Override
    @Transactional
    public CareTargetDetailResponseDTO updateCareTargetDetail(
            Long organizationId, Long careTargetId, CareTargetUpdateRequestDTO updateDTO, MultipartFile file) {

        CareTarget target = careTargetRepository.findById(careTargetId)
                .orElseThrow(() -> new IllegalArgumentException("대상자가 없습니다."));

        log.info("케어대상자" + target.getName());
        Doctor doctor = doctorRepository.findById(updateDTO.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("의료진이 없습니다."));

        target.changeDetailInfo(updateDTO, doctor);

        log.info("케어대상자 수정" + target.getName());

        careTargetRepository.save(target);



        if (file != null && !file.isEmpty()) {
            uploadFileService.deletecareTargetFiles(organizationId,careTargetId);

            List<MultipartFile> files = Collections.singletonList(file);
            TargetFileDTO targetFileDTO = TargetFileDTO.builder()
                    .targetType(UploadTargetType.CARE_TARGET)
                    .targetId(careTargetId)
                    .organizationId(organizationId)
                    .files(files)
                    .build();

            List<UploadFileResponseDTO> saveFile = uploadFileService.saveFiles(targetFileDTO);
        } else if (Boolean.TRUE.equals(updateDTO.getIsDelete())) {
            uploadFileService.deletecareTargetFiles(organizationId,careTargetId);
        }

        return getCareTargetDetail(organizationId, careTargetId);
    }

    //삭제 처리-----------------------------------------------------------------------------------------
    @Override
    @Transactional
    public void deleteCareTarget(List<Long> careTargetIds, Long organizationId) {
        if (careTargetIds == null || careTargetIds.isEmpty()) return;

        // 1. 각 케어대상자 ID를 순회하며 관련 파일들을 먼저 삭제
        for (Long careTargetId : careTargetIds) {
            // 해당 대상자의 파일 리스트 조회 (기존에 만든 findBy... 메서드 활용)
            UploadTargetType uploadTargetType = UploadTargetType.CARE_TARGET;
            List<UploadFile> uploadFiles = uploadFileRepository.findByCareTargetAndType(careTargetId, organizationId, uploadTargetType);
            if (!uploadFiles.isEmpty()) {
                uploadFileService.deleteFiles(uploadFiles);
            }
        }
        careTargetGroupMapRepository.deleteByCareTargetIds(careTargetIds, organizationId);
        careTargetRepository.deleteAllById(careTargetIds);
    }
//Tool------------------------------------------------------------------------------------
    @Transactional
    public String updateToolCareTarget(CareTargetInsertRequestDTO updateDto, Long careTargetId) {
        CareTarget careTarget = careTargetRepository.findById(careTargetId)
                .orElseThrow(() -> new RuntimeException("해당 환자를 찾을 수 없습니다. ID: " + careTargetId));

        // 변경된 상세 내용을 담을 리스트
        List<String> changeDetails = new ArrayList<>();

        if (updateDto.getName() != null) changeDetails.add("- 성함: " + updateDto.getName());
        if (updateDto.getAge() > 0) changeDetails.add("- 나이: " + updateDto.getAge() + "세");
        if (updateDto.getGender() != null) changeDetails.add("- 성별: " + updateDto.getGender());
        if (updateDto.getTargetPhone() != null) changeDetails.add("- 연락처: " + updateDto.getTargetPhone());
        if (updateDto.getDisease() != null) changeDetails.add("- 주요 질환: " + updateDto.getDisease());
        if (updateDto.getGuardianName() != null) changeDetails.add("- 보호자 성함: " + updateDto.getGuardianName());
        if (updateDto.getGuardianPhone() != null) changeDetails.add("- 보호자 연락처: " + updateDto.getGuardianPhone());
        if (updateDto.getGuardianRelationship() != null) changeDetails.add("- 보호자 관계: " + updateDto.getGuardianRelationship());

        if (changeDetails.isEmpty()) {
            return "수정할 정보가 전달되지 않아 변경된 내용이 없습니다.";
        }

        // 엔티티 업데이트 로직
        careTarget.updateFromAi(
                updateDto.getName(),
                updateDto.getAge() > 0 ? updateDto.getAge() : null,
                updateDto.getGender(),
                updateDto.getTargetPhone(),
                updateDto.getDisease(),
                updateDto.getGuardianName(),
                updateDto.getGuardianPhone(),
                updateDto.getGuardianRelationship()
        );

        log.info("[DB 업데이트 완료] ID: {}, 변경 내용: {}", careTargetId, String.join(", ", changeDetails));

        return String.format(
                "[수정 성공] 대상자 ID: %d | 변경 항목: %s. " +
                        "사용자에게 변경 완료 사실을 간결하게 알리고 추가 요청을 확인하세요.",
                careTargetId,
                String.join(", ", changeDetails)
        );
    }

    public CareTarget getCareTarget(Long id){
        CareTarget ct = careTargetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대상자"));
        return ct;
    }

    //위험 데이타 툴---------------------------------------------------------------------------
    public Map<String, Object> getRiskFindAll(Long organizationId, int range) {
        log.info("[위험도 분석 시작] 조직ID: {}, 조회범위: {}일", organizationId, range);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<Long> careTargetIds = careTargetRepository.findIdsByOrganizationId(organizationId);

        List<RiskTrendDTO> allTrends = new ArrayList<>();

        for (Long careTargetId : careTargetIds) {
            String targetName = careTargetRepository.findNameByCareTargetId(careTargetId);
            final String finalTargetName = (targetName != null) ? targetName : "이름 없음";

            List<RiskScore> dbScores = riskScoreRepository.findTrendData(careTargetId, LocalDateTime.now().minusDays(range));

            Map<LocalDate, RiskScore> latestPerDay = new LinkedHashMap<>();

            for (RiskScore rs : dbScores) {
                if (rs.getCalculatedAt() == null) continue;
                LocalDate d = rs.getCalculatedAt().toLocalDate();
                latestPerDay.merge(d, rs, (a, b) -> a.getCalculatedAt().isAfter(b.getCalculatedAt()) ? a : b);
            }

            List<RiskTrendDTO> patientTrend = latestPerDay.entrySet().stream()
                    .sorted(Map.Entry.<LocalDate, RiskScore>comparingByKey().reversed())
                    .limit(range)
                    .map(Map.Entry::getValue)
                    .sorted(Comparator.comparing(RiskScore::getCalculatedAt))
                    .map(rs -> new RiskTrendDTO(
                            rs.getRiskScore() != null ? rs.getRiskScore() : 0,
                            rs.getCalculatedAt().toLocalDate().format(formatter),
                            finalTargetName,
                            careTargetId
                    ))
                    .toList();
            allTrends.addAll(patientTrend);
        }

        Map<Long, List<RiskTrendDTO>> grouped = allTrends.stream()
                .collect(Collectors.groupingBy(RiskTrendDTO::getCareTargetId));

        List<Map<String, Object>> stats = grouped.values().stream()
                .map(list -> {
                    log.info("   - 통계 계산 중: 환자명({}) 데이터 개수({})", list.getFirst().getTargetName(), list.size());
                    String name = list.getFirst().getTargetName();
                    int latest = list.isEmpty() ? 0 : list.getLast().getScore();
                    double avg = list.stream().mapToInt(RiskTrendDTO::getScore).average().orElse(0.0);

                    Map<String, Object> m = new HashMap<>();
                    m.put("name", name);
                    m.put("latest", latest);
                    m.put("avg", avg);
                    m.put("trendList", list); // 급상승 계산을 위해 리스트도 저장
                    return m;
                }).toList();


        List<String> top3ByLatest = stats.stream()
                .sorted((a, b) -> Integer.compare((int)b.get("latest"), (int)a.get("latest")))
                .limit(3)
                .map(m -> String.format("이름:%s (점수:%d점)", m.get("name"), (int)m.get("latest")))
                .toList();
        log.info("   - 최근 점수 상위 3명 추출 완료");

        List<String> top3ByAverage = stats.stream()
                .sorted((a, b) -> Double.compare((double)b.get("avg"), (double)a.get("avg")))
                .limit(3)
                .map(m -> String.format("이름:%s (평균:%d점)", m.get("name"), (int)Math.round((double)m.get("avg"))))
                .toList();
        log.info("   - 평균 점수 상위 3명 추출 완료");

        // 급상승 중인 대상자 top3 계산 (최근 점수와 이전 점수 비교)
        List<String> top3ByRising = grouped.values().stream()
                .filter(list -> list.size() >= 2) // 최소 2개 데이터 필요
                .map(list -> {
                    int recentScore = list.get(list.size() - 1).getScore(); // 최근 점수
                    int previousScore = list.get(list.size() - 2).getScore(); // 이전 점수
                    int increase = recentScore - previousScore; // 증가량
                    String name = list.getFirst().getTargetName();
                    // Map으로 타입 안전하게 반환
                    Map<String, Object> result = new HashMap<>();
                    result.put("name", name);
                    result.put("increase", increase);
                    result.put("recentScore", recentScore);
                    return result;
                })
                .filter(m -> (int)m.get("increase") > 0)
                .sorted((a, b) -> Integer.compare((int)b.get("increase"), (int)a.get("increase"))) // 증가량 큰 순
                .limit(3)
                .map(m -> String.format("이름:%s (증가:%d점, 최근:%d점)", 
                        (String)m.get("name"), 
                        (int)m.get("increase"), 
                        (int)m.get("recentScore")))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("최근_위험_점수_상위3명", top3ByLatest);
        result.put("평균_위험_점수_상위3명", top3ByAverage);
        result.put("급상승_중인_대상자_상위3명", top3ByRising);

        log.info("[분석 종료] 최종 결과 리턴 직전: {}", result);
        return result;
    }
}
