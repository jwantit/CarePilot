package com.carepilot.service.caretarget;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.RiskScore;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.enums.UploadTargetType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.caretarget.*;
import com.carepilot.dto.upload.TargetFileDTO;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.call.RiskScoreRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.DoctorRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.service.upload.UploadFileService;
import org.springframework.transaction.annotation.Transactional; // 1. 임포트 확인!
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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


    //대량 환자등록 ---------------------------------------------------------------------------
    @Override
    @Transactional
    public List<CareTargetListResponseDTO> csvOrExcelCareTargetSave(List<CsvDTO> csvs, Long organizationId, Boolean careStatus) {

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
                    .disease(dto.getDisease())
                    .careStatus(careStatus)
                    .targetPhone(dto.getPhone())
                    .guardianName(dto.getGuardianName())
                    .guardianPhone(dto.getGuardianPhone())
                    .guardianRelationship(dto.getGuardianRelationship())
                    .build();

            log.info("저장중");
            careTargetRepository.save(ct);
            log.info("저장 완료");

        }
        return getCareTargetList(organizationId, "","");
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
                .careStatus(careTargetInsertRequestDTO.getCareStatus())
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

        return getCareTargetList(careTargetInsertRequestDTO.getOrganizationId(), "","");


    }
    //END-------------------------------------------------------------------------------------------


    @Override
    public List<CareTargetListResponseDTO> getCareTargetList(Long organizationId, String status, String keyword) {

        Boolean filter = null;
        if (status.equals("active")){
            filter = true;
        } else if (status.equals("inactive")) {
            filter = false;
        }

        List<CareTarget> careTargets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(organizationId, filter, keyword);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        log.info("케어 대상자 조회 진입");

        List<CareTargetListResponseDTO> result = new ArrayList<>();
        for (CareTarget ct : careTargets){

            log.info("순회 진입");

            Optional<Call> lastCallOpt = callRepository.findTopByCareTargetId(ct.getCareTargetId());
            String lastCallDate = lastCallOpt
                    .map(call -> call.getStartTime().format(formatter))
                    .orElse(null);


            Integer latestScore = riskScoreRepository.findLatestByCareTargetId(ct.getCareTargetId())
                    .map(RiskScore::getRiskScore)
                    .orElse(0);

            List<UploadFileResponseDTO> tempfiles = uploadFileService.careTargetFiles(organizationId, ct.getCareTargetId());
            List<UploadFileResponseDTO> filesScores = (tempfiles != null && !tempfiles.isEmpty())
                    ? tempfiles
                    : null;

            log.info("도메인 전부 가져오기 성공");
            CareTargetListResponseDTO dto = CareTargetListResponseDTO.builder()
                    .careTargetId(ct.getCareTargetId())
                    .thumbnailStoragePath(filesScores != null ? filesScores.getFirst().getThumbnailUrl() : null)
                    .name(ct.getName())
                    .age(ct.getAge())
                    .disease(ct.getDisease())
                    .riskScore(latestScore)
                    .recentCall(lastCallDate)
                    .careStatus(ct.getCareStatus())
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

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd"); // 차트용 짧은 날짜 포맷

        CareTarget careTarget = careTargetRepository.findById(careTargetId).orElseThrow();

        List<Call> calls = callRepository.findAllByCareTargetId(careTargetId);

        //가장 최근 통화 ai요약 가져오기
        String latestAiMemo = (calls != null && !calls.isEmpty())
                ? calls.get(0).getAiMemo()
                : null;

//. 데이터 존재 여부에 따라 null 또는 DTO 리스트 할당
        List<CallHistoryDTO> callHistoryDTOS = (calls != null && !calls.isEmpty())
                ? calls.stream()
                .map(c -> CallHistoryDTO.builder()
                        .callType(c.getCallType() != null ? c.getCallType().name() : null)
                        .startTime(c.getStartTime().format(formatter))
                        .summary(c.getSummary())
                        .status(c.getStatus() != null ? c.getStatus().name() : null)
                        .build())
                .toList()
                : null;




        List<UploadFileResponseDTO> tempfiles = uploadFileService.careTargetFiles(organizationId, careTargetId);
        List<UploadFileResponseDTO> filesScores = (tempfiles != null && !tempfiles.isEmpty())
                ? tempfiles
                : null;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeMonthsAgo = now.minusMonths(3);
        List<RiskScore> dbScores = riskScoreRepository.findTrendData(careTargetId, threeMonthsAgo);


        Map<LocalDate, Integer> scoreMap = dbScores.stream()
                .collect(Collectors.toMap(
                        rs -> rs.getCalculatedAt().toLocalDate(),
                        RiskScore::getRiskScore,
                        (existing, replacement) -> replacement
                ));

        List<RiskTrendDTO> trendList = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusMonths(3);

        LocalDate cursor = startDate;
        while (cursor.getDayOfWeek() != today.getDayOfWeek()) {
            cursor = cursor.plusDays(1);
        }

        while (!cursor.isAfter(today)) {
            LocalDate weekStart = cursor;
            LocalDate weekEnd = cursor.plusDays(7); // 다음 기준점까지가 한 주

            // 해당 7일 범위 내에 있는 데이터들 중 가장 높은 점수(Max) 찾기
            int maxScoreInWeek = dbScores.stream()
                    .filter(rs -> {
                        LocalDate dataDate = rs.getCalculatedAt().toLocalDate();
                        // 데이터 날짜가 이번 주 범위(weekStart <= 날짜 < weekEnd)에 있는지 확인
                        return !dataDate.isBefore(weekStart) && dataDate.isBefore(weekEnd);
                    })
                    .mapToInt(RiskScore::getRiskScore)
                    .max() // 가장 큰 값 추출
                    .orElse(0); // 데이터가 없으면 0점

            trendList.add(new RiskTrendDTO(maxScoreInWeek, weekStart.format(formatter)));

            cursor = weekEnd; // 다음 주로 이동
        }

        CareTargetDoctorResponseDTO doctor = Optional.ofNullable(careTarget.getDoctor())
                .map(d -> CareTargetDoctorResponseDTO.builder()
                        .doctorId(d.getDoctorId())
                        .doctorName(d.getName())
                        .doctorSpecialty(d.getSpecialty())
                        .build())
                .orElse(null); // 의사가 없으면 doctor 변수 자체가 null이 됨

        return CareTargetDetailResponseDTO.builder()
                .file(filesScores != null ? filesScores.getFirst().getFileUrl() : null)
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
        }

        return getCareTargetDetail(organizationId, careTargetId);
    }
}
