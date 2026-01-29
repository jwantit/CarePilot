package com.carepilot.controller.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallDirection;
import com.carepilot.domain.call.CallRecording;
import com.carepilot.domain.call.CallStatus;
import com.carepilot.domain.call.CallType;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.file.UploadFileType;
import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.organization.Organization;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Say;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/twilio")
@RequiredArgsConstructor
@Log4j2
public class TwilioController {

    private final CallRepository callRepository;
    private final CallRecordingRepository callRecordingRepository;
    private final CareTargetRepository careTargetRepository;
    private final OrganizationRepository organizationRepository;
    private final UploadFileRepository uploadFileRepository;

    @Value("${app.ngrok.base-url}")
    private String ngrokBaseUrl;

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    /**
     * [1단계] Twilio가 가장 먼저 찌르는 엔드포인트
     * 트라이얼 안내가 나올 때 1번을 누르도록 유도합니다.
     */
    @RequestMapping(
            value = "/twiml/voice",
            method = {RequestMethod.GET, RequestMethod.POST},
            produces = "application/xml; charset=UTF-8"
    )
    @ResponseBody
    public ResponseEntity<String> getVoiceTwiML() {
        VoiceResponse twiml = new VoiceResponse.Builder()
                .gather(new Gather.Builder()
                        .numDigits(1)
                        .action(ngrokBaseUrl + "/api/twilio/voice/menu")
                        .method(com.twilio.http.HttpMethod.POST)
                        .say(new Say.Builder("안녕하세요, 케어파일럿입니다. 서비스를 시작하려면 키패드 1번을 눌러주세요.")
                                .language(Say.Language.KO_KR)
                                .voice(Say.Voice.POLLY_SEOYEON)
                                .build())
                        .build())
                .say(new Say.Builder("입력이 감지되지 않아 통화를 종료합니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build())
                .build();

        return ResponseEntity.ok().body(cleanXml(twiml.toXml()));
    }

    /**
     * [2단계] 1번을 눌렀을 때 실행되는 메뉴 처리
     */
    @PostMapping(value = "/voice/menu", produces = "application/xml; charset=UTF-8")
    @ResponseBody
    public ResponseEntity<String> handleMenu(@RequestParam(value = "Digits", required = false) String digits) {
        VoiceResponse.Builder rb = new VoiceResponse.Builder();

        if ("1".equals(digits)) {
            rb.gather(new Gather.Builder()
                    .inputs(java.util.Collections.singletonList(Gather.Input.SPEECH))
                    .language(Gather.Language.KO_KR)
                    .speechTimeout("auto")
                    .action(ngrokBaseUrl + "/api/twilio/voice/gather-speech")
                    .method(com.twilio.http.HttpMethod.POST)
                    .say(new Say.Builder("네, 연결되었습니다. 오늘 컨디션이 어떠신지 말씀해 주세요.")
                            .language(Say.Language.KO_KR)
                            .voice(Say.Voice.POLLY_SEOYEON)
                            .build())
                    .build());
        } else {
            rb.say(new Say.Builder("잘못된 입력입니다. 다시 전화를 걸어주세요.")
                    .language(Say.Language.KO_KR)
                    .voice(Say.Voice.POLLY_SEOYEON)
                    .build());
        }

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    /**
     * [3단계] 음성 인식(STT) 결과 처리 및 DB 저장
     */
    @PostMapping(value = "/voice/gather-speech", produces = "application/xml; charset=UTF-8")
    @ResponseBody
    @Transactional
    public ResponseEntity<String> handleSpeech(
            @RequestParam(value = "SpeechResult", required = false) String speechResult,
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "From", required = false) String fromNumber) {

        VoiceResponse.Builder rb = new VoiceResponse.Builder();

        try {
            if (speechResult != null && !speechResult.trim().isEmpty()) {
                saveCallData(speechResult, callSid, fromNumber);
                rb.say(new Say.Builder("알겠습니다. '" + escapeXml(speechResult) + "'라고 기록했습니다. 건강 유의하세요.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
            } else {
                rb.say(new Say.Builder("답변을 듣지 못했습니다. 다음에 다시 연락드리겠습니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
            }
        } catch (Exception e) {
            log.error("DB 저장 중 에러 발생: {}", e.getMessage(), e);
            rb.say(new Say.Builder("시스템 오류가 발생했지만 답변은 확인했습니다.")
                    .language(Say.Language.KO_KR)
                    .voice(Say.Voice.POLLY_SEOYEON)
                    .build());
        }

        rb.say(new Say.Builder("통화를 종료합니다.")
                .language(Say.Language.KO_KR)
                .voice(Say.Voice.POLLY_SEOYEON)
                .build());

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    // Twilio 녹음 완료 웹훅 엔드포인트
    @PostMapping("/recording/status")
    @Transactional
    public ResponseEntity<Void> handleRecordingStatus(
            @RequestParam(value = "CallSid") String callSid,
            @RequestParam(value = "RecordingSid") String recordingSid,
            @RequestParam(value = "RecordingUrl") String recordingUrl,
            @RequestParam(value = "RecordingStatus") String recordingStatus,
            @RequestParam(value = "RecordingDuration", required = false) String recordingDuration,
            @RequestParam(value = "RecordingChannels", required = false) String recordingChannels) {

        log.info("녹음 상태 업데이트: callSid={}, recordingSid={}, status={}, url={}",
                callSid, recordingSid, recordingStatus, recordingUrl);

        if (!"completed".equals(recordingStatus)) {
            return ResponseEntity.ok().build();
        }

        try {
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isEmpty()) {
                log.warn("CallSid로 Call을 찾을 수 없음: callSid={}", callSid);
                return ResponseEntity.ok().build();
            }
            Call call = callOpt.get();

            String fileName = "recording_" + recordingSid + ".mp3";
            String storagePath = downloadAndSaveRecording(recordingUrl, call.getCallId());
            if (storagePath == null) {
                return ResponseEntity.ok().build();
            }

            UploadFile savedFile = uploadFileRepository.save(
                    UploadFile.builder()
                            .organization(call.getOrganization())
                            .targetType(UploadTargetType.CALL_LOG)
                            .fileType(UploadFileType.AUDIO)
                            .call(call)
                            .careTarget(call.getCareTarget())
                            .originalName(fileName)
                            .storagePath(storagePath)
                            .contentType("audio/mpeg")
                            .fileSize(getFileSize(storagePath))
                            .build()
            );

            Optional<CallRecording> existing = callRecordingRepository.findByCall_CallId(call.getCallId());
            existing.ifPresent(callRecordingRepository::delete);

            CallRecording callRecording = CallRecording.builder()
                    .call(call)
                    .file(savedFile)
                    .transcript(call.getSummary())
                    .build();

            callRecordingRepository.save(callRecording);

            log.info("녹음 파일 저장 완료: callId={}, recordingId={}, fileId={}, storagePath={}",
                    call.getCallId(), callRecording.getRecordingId(), savedFile.getFileId(), storagePath);
        } catch (Exception e) {
            log.error("녹음 파일 저장 실패: callSid={}, error={}", callSid, e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }

    private String cleanXml(String rawXml) {
        String trimmed = rawXml.trim();
        return trimmed.startsWith("<?xml") ? trimmed : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + trimmed;
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String downloadAndSaveRecording(String recordingUrl, Long callId) {
        try {
            String auth = twilioAccountSid + ":" + twilioAuthToken;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            URL url = new URL(recordingUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestProperty("Authorization", "Basic " + encodedAuth);

            String storagePath = "CALL_LOG/" + callId + "/" + UUID.randomUUID() + ".mp3";
            Path filePath = Paths.get("uploads", storagePath);
            Files.createDirectories(filePath.getParent());

            try (InputStream inputStream = connection.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("녹음 파일 다운로드 완료: url={}, storagePath={}", recordingUrl, storagePath);
            return storagePath;
        } catch (Exception e) {
            log.error("녹음 파일 다운로드 실패: url={}, error={}", recordingUrl, e.getMessage(), e);
            return null;
        }
    }

    private Long getFileSize(String storagePath) {
        try {
            Path filePath = Paths.get("uploads", storagePath);
            return Files.exists(filePath) ? Files.size(filePath) : 0L;
        } catch (Exception e) {
            log.warn("파일 크기 확인 실패: storagePath={}", storagePath);
            return 0L;
        }
    }

    private void saveCallData(String speechResult, String callSid, String fromNumber) {
        try {
            // 1) Twilio 번호 정규화 (+8210... -> 010...)
            String normalizedFromNumber = "01000000000";
            if (fromNumber != null && !fromNumber.isEmpty()) {
                if (fromNumber.startsWith("+82")) {
                    normalizedFromNumber = "0" + fromNumber.substring(3).replaceAll("[^0-9]", "");
                } else {
                    normalizedFromNumber = fromNumber.replaceAll("[^0-9]", "");
                    if (!normalizedFromNumber.startsWith("0") && normalizedFromNumber.length() > 9) {
                        normalizedFromNumber = "0" + normalizedFromNumber;
                    }
                }
            }
            final String finalTwilioPhone = normalizedFromNumber;

            // 2) Organization 기본값 (현재 구현 유지)
            List<Organization> orgs = organizationRepository.findAll();
            if (orgs.isEmpty()) return;
            Organization organization = orgs.get(0);

            // 3) CareTarget 조회 (DB의 하이픈 제거 후 비교)
            CareTarget careTarget = careTargetRepository.findAll().stream()
                    .filter(t -> t.getTargetPhone() != null &&
                            t.getTargetPhone().replaceAll("[^0-9]", "").equals(finalTwilioPhone))
                    .findFirst()
                    .orElseGet(() -> {
                        List<CareTarget> all = careTargetRepository.findAll();
                        return all.isEmpty() ? null : all.get(0);
                    });

            if (careTarget == null) return;

            Call call = callRepository.save(Call.builder()
                    .organization(organization)
                    .careTarget(careTarget)
                    .direction(CallDirection.OUTBOUND)
                    .callType(CallType.REGULAR_MONITORING)
                    .status(CallStatus.SUCCESS)
                    .startTime(java.time.LocalDateTime.now())
                    .endTime(java.time.LocalDateTime.now())
                    .summary("음성 인식 답변: " + speechResult)
                    .callerId(finalTwilioPhone)  // 전화번호 저장
                    .callSid(callSid)  // Twilio CallSid 저장
                    .build());

            UploadFile savedFile = uploadFileRepository.save(UploadFile.builder()
                    .organization(organization)
                    .targetType(UploadTargetType.CALL_LOG)
                    .fileType(UploadFileType.AUDIO)
                    .call(call)
                    .originalName("stt.txt")
                    .storagePath("calls/stt/" + UUID.randomUUID())
                    .contentType("text/plain")
                    .fileSize((long) speechResult.getBytes(StandardCharsets.UTF_8).length)
                    .build());

            callRecordingRepository.save(CallRecording.builder()
                    .call(call)
                    .file(savedFile)
                    .transcript(speechResult)
                    .build());
        } catch (Exception e) {
            log.error("saveCallData 에러: {}", e.getMessage(), e);
        }
    }
}


