package com.carepilot.service.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.CallType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.file.UploadFileType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.dto.call.CallDetailResponseDTO;
import com.carepilot.dto.call.CallResponseDTO;
import com.carepilot.dto.call.ScheduleCreateRequestDTO;
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
import java.util.UUID;

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
  @Autowired private UploadFileRepository uploadFileRepository;

  private Organization testOrg;
  private CareTarget testTarget;

  @BeforeEach
  void setUp() {
    testOrg = Organization.builder().name("케어파일럿 병원").build();
    organizationRepository.save(testOrg);

    testTarget =
        CareTarget.builder().name("홍길동").organization(testOrg).targetPhone("010-1234-5678").build();
    careTargetRepository.save(testTarget);
  }

  @Test
  @DisplayName("통화 이력 조회는 더미 데이터를 저장한 만큼 결과를 늘려준다")
  void getCallHistory_returnsDummyEntries() {
    Call firstCall =
        persistDummyCall(LocalDateTime.now().minusMinutes(15), CallStatus.SUCCESS, "첫번째 통화송출");
    Call secondCall =
        persistDummyCall(LocalDateTime.now().minusMinutes(5), CallStatus.FAILED, "두번째 통화송출");

    List<CallResponseDTO> history = callService.getCallHistory();

    assertThat(history)
        .hasSizeGreaterThanOrEqualTo(2)
        .extracting(CallResponseDTO::getCallId)
        .contains(firstCall.getCallId(), secondCall.getCallId());
    assertThat(history)
        .extracting(CallResponseDTO::getStatusLabel)
        .contains("성공", "실패");
  }

  @Test
  @DisplayName("통화 상세 정보에 녹취와 상태 라벨이 포함된다")
  void getCallDetail_includesRecordingAndStatusLabel() {
    Call call = persistDummyCall(LocalDateTime.now(), CallStatus.SUCCESS, "dummy-transcript");

    CallDetailResponseDTO detail = callService.getCallDetail(call.getCallId());

    assertThat(detail.getTranscript()).contains("dummy-transcript");
    assertThat(detail.getStatusLabel()).isEqualTo("성공");
    assertThat(detail.getRecordingFileName()).isNotBlank();
  }

  @Test
  @DisplayName("일정 등록 요청이 정상적으로 저장된다")
  void createScheduleTest() {
    ScheduleCreateRequestDTO request =
        ScheduleCreateRequestDTO.builder()
            .organizationId(testOrg.getOrganizationId())
            .careTargetId(testTarget.getCareTargetId())
            .scheduledTime(LocalDateTime.now().plusDays(1))
            .type("ONE_TIME")
            .priority("HIGH")
            .memo("일회성 정기 상담")
            .build();

    Long scheduleId = callService.createSchedule(request);

    assertThat(scheduleId).isNotNull();
    log.info("생성된 스케줄 ID: {}", scheduleId);
  }

  private Call persistDummyCall(LocalDateTime startTime, CallStatus status, String transcript) {
    Call call =
        callRepository.save(
            Call.builder()
                .organization(testOrg)
                .careTarget(testTarget)
                .status(status)
                .direction(CallDirection.INBOUND)
                .callType(CallType.REGULAR_MONITORING)
                .startTime(startTime)
                .duration(120)
                .build());

    attachRecording(call, transcript);
    return call;
  }

  private void attachRecording(Call call, String content) {
    UploadFile file =
        uploadFileRepository.save(
            UploadFile.builder()
                .organization(testOrg)
                .fileType(UploadFileType.AUDIO)
                .originalName("record_" + UUID.randomUUID() + ".mp3")
                .storagePath("calls/" + UUID.randomUUID() + ".mp3")
                .contentType("audio/mpeg")
                .build());

    callRecordingRepository.save(
        CallRecording.builder().call(call).file(file).transcript(content).build());
  }
}