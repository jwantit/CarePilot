package com.carepilot.service.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.file.UploadFileType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
import com.carepilot.dto.call.ScheduleResponseDTO;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Rollback(false)
@Log4j2
public class CallServiceTests {

    @Autowired private CallService callService;
    @Autowired private CallRepository callRepository;
    @Autowired private CareTargetRepository careTargetRepository;
    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private CallRecordingRepository callRecordingRepository;
    @Autowired private UploadFileRepository uploadFileRepository; // 파일 리포지토리 추가

    private Organization testOrg;
    private CareTarget testTarget;

    @BeforeEach
    void setUp() {
        testOrg = Organization.builder().name("케어파일럿 병원").build();
        organizationRepository.save(testOrg);

        // CareTarget 생성 시 필드명(targetPhone 등)을 확인하여 맞춤
        testTarget = CareTarget.builder()
                .name("홍길동")
                .organization(testOrg)
                .build();
        careTargetRepository.save(testTarget);
    }

    @Test
    @DisplayName("통화 상세 정보 조회 테스트 (녹취 파일 포함)")
    void getCallDetailTest() {
        // 1. UploadFile 먼저 생성 (CallRecording의 Not Null 제약조건 해결)
        UploadFile file = UploadFile.builder()
                .organization(testOrg) // <- 이 부분이 누락되어 에러가 났습니다.
                .fileType(UploadFileType.AUDIO)
                .originalName("test_record.mp3")
                .storagePath("/test/path")
                .build();
        uploadFileRepository.save(file);

        // 2. Call 생성
        Call call = callRepository.save(Call.builder()
                .organization(testOrg)
                .careTarget(testTarget)
                .status(CallStatus.SUCCESS)
                .startTime(LocalDateTime.now())
                .build());

        // 3. CallRecording 생성
        callRecordingRepository.save(CallRecording.builder()
                .call(call)
                .file(file)
                .transcript("환자: 기분이 좋아요. AI: 다행이네요.")
                .build());

        // when
        CallDetailResponseDTO detail = callService.getCallDetail(call.getCallId());

        // then
        assertThat(detail.getTranscript()).contains("기분이 좋아요");
    }

    @Test
    @DisplayName("통화 일정 등록 테스트 (정의된 Enum 사용)")
    void createScheduleTest() {
        // given
        ScheduleCreateRequestDTO request = ScheduleCreateRequestDTO.builder()
                .organizationId(testOrg.getOrganizationId())
                .careTargetId(testTarget.getCareTargetId())
                .scheduledTime(LocalDateTime.now().plusDays(1))
                .type("ONE_TIME") // 제공해주신 ONE_TIME 사용
                .priority("HIGH")
                .memo("일회성 정기 상담")
                .build();

        // when
        Long scheduleId = callService.createSchedule(request);

        // then
        assertThat(scheduleId).isNotNull();
        log.info("생성된 스케줄 ID: " + scheduleId);
    }
}