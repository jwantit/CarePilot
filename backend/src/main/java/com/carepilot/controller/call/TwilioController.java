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
import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.repository.call.CallRecordingRepository;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.config.ScenarioQuestionRepository;
import com.carepilot.repository.config.ScenarioRepository;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.sms.InboundSmsRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.carepilot.service.call.emergency.EmergencyDetectionService;
import com.carepilot.service.call.emergency.EmergencyDetectionResult;
import com.carepilot.service.call.generation.QuestionGenerationService;
import com.carepilot.service.call.vector.CallVectorStoreService;
import com.carepilot.service.callanalysis.CallAnalysisService;
import com.carepilot.service.notification.NotificationService;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.repository.notification.NotificationRepository;
import java.util.ArrayList;
import com.carepilot.service.sms.ScheduleChangeService;
import com.carepilot.service.prescription.PrescriptionService;
import com.carepilot.service.sms.SmsTypeService;
import com.carepilot.service.upload.UploadFileService;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Say;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/twilio")
@RequiredArgsConstructor
@Log4j2
public class TwilioController {

    // Twilio Gather 설정 전역 변수
    private static final String GATHER_SPEECH_TIMEOUT = "auto";
    private static final int GATHER_TIMEOUT = 20;

    private final CallRepository callRepository;
    private final CallRecordingRepository callRecordingRepository;
    private final CareTargetRepository careTargetRepository;
    private final OrganizationRepository organizationRepository;
    private final UploadFileRepository uploadFileRepository;
    private final ScenarioRepository scenarioRepository;
    private final ScenarioQuestionRepository scenarioQuestionRepository;
    private final CallVectorStoreService callVectorStoreService;
    private final EmergencyDetectionService emergencyDetectionService;
    private final QuestionGenerationService questionGenerationService;
    private final NotificationService notificationService;
    private final CallAnalysisService callAnalysisService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final InboundSmsRepository inboundSmsRepository;
    private final UploadFileService uploadFileService;
    private final SmsTypeService smsTypeService;
    private final ScheduleChangeService scheduleChangeService;
    private final PrescriptionService prescriptionService;

    @Value("${app.ngrok.base-url}")
    private String ngrokBaseUrl;

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    /**
     * [1단계] Twilio가 가장 먼저 호출하는 엔드포인트
     * 인사말을 말하고, 시나리오가 있으면 첫 번째 질문을 시작하고, 없으면 일반 STT 입력을 받습니다.
     */
    @RequestMapping(
            value = "/twiml/voice",
            method = {RequestMethod.GET, RequestMethod.POST},
            produces = "application/xml; charset=UTF-8"
    )
    @ResponseBody
    public ResponseEntity<String> getVoiceTwiML(
            @RequestParam(value = "CallSid") String callSid) {
        VoiceResponse.Builder rb = new VoiceResponse.Builder();

        try {
            // CallSid로 Call 찾기
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isPresent()) {
                Call call = callOpt.get();
                Scenario scenario = null;
                
                // CallSchedule을 통해 Scenario 찾기
                if (call.getCallSchedule() != null) {
                    scenario = call.getCallSchedule().getScenario();
                }
                
                // 인사말 먼저 말하기 (시나리오 있든 없든)
                rb.say(new Say.Builder("안녕하세요, 케어파일럿입니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
                
                // Scenario가 있으면 시나리오 기반 질문 시작
                if (scenario != null) {
                    // 시나리오의 첫 번째 질문 가져오기
                    List<ScenarioQuestion> questions = scenarioQuestionRepository
                            .findByScenarioOrderByQuestionOrderAsc(scenario);
                    
                    if (questions.isEmpty()) {
                        rb.say(new Say.Builder("질문이 설정되지 않았습니다.")
                                .language(Say.Language.KO_KR)
                                .voice(Say.Voice.POLLY_SEOYEON)
                                .build());
                    } else {
                        // 첫 번째 질문 가져오기
                        ScenarioQuestion firstQuestion = questions.get(0);
                        String originalQuestion = firstQuestion.getQuestionText();
                        CareTarget careTarget = call.getCareTarget();

                        // 첫 번째 질문은 시나리오 텍스트 그대로 사용 (동적 생성 스킵)
                        String contextualQuestion = originalQuestion;
                        
                        // 질문을 transcript에 저장
                        updateTranscriptWithQuestion(callSid, contextualQuestion);

                        // 변형된 질문을 바로 읽어줌
                        String firstActionUrl = ngrokBaseUrl + "/api/twilio/voice/conversation?questionIdx=1";
                        log.info("첫 번째 질문 송출: actionUrl={}, question={}", firstActionUrl, contextualQuestion);

                        rb.gather(new Gather.Builder()
                                .inputs(Collections.singletonList(Gather.Input.SPEECH))
                                .language(Gather.Language.KO_KR)
                                .speechTimeout(GATHER_SPEECH_TIMEOUT)
                                .timeout(GATHER_TIMEOUT)
                                .action(firstActionUrl)
                                .method(com.twilio.http.HttpMethod.POST)
                                .say(new Say.Builder(contextualQuestion)
                                        .language(Say.Language.KO_KR)
                                        .voice(Say.Voice.POLLY_SEOYEON)
                                        .build())
                                .build());
                    }
                } else {
                    // Scenario가 없으면 기존 방식으로 진행
                    rb.gather(new Gather.Builder()
                            .inputs(Collections.singletonList(Gather.Input.SPEECH))
                            .language(Gather.Language.KO_KR)
                            .speechTimeout(GATHER_SPEECH_TIMEOUT)
                            .timeout(GATHER_TIMEOUT)
                            .action(ngrokBaseUrl + "/api/twilio/voice/gather-speech")
                            .method(com.twilio.http.HttpMethod.POST)
                            .say(new Say.Builder("오늘 컨디션이 어떠신지 말씀해 주세요.")
                                    .language(Say.Language.KO_KR)
                                    .voice(Say.Voice.POLLY_SEOYEON)
                                    .build())
                            .build());
                }
            } else {
                // Call을 찾을 수 없으면 기존 방식으로 진행
                rb.say(new Say.Builder("안녕하세요, 케어파일럿입니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
                rb.gather(new Gather.Builder()
                        .inputs(Collections.singletonList(Gather.Input.SPEECH))
                        .language(Gather.Language.KO_KR)
                        .speechTimeout(GATHER_SPEECH_TIMEOUT)
                        .timeout(GATHER_TIMEOUT)
                        .action(ngrokBaseUrl + "/api/twilio/voice/gather-speech")
                        .method(com.twilio.http.HttpMethod.POST)
                        .say(new Say.Builder("오늘 컨디션이 어떠신지 말씀해 주세요.")
                                .language(Say.Language.KO_KR)
                                .voice(Say.Voice.POLLY_SEOYEON)
                                .build())
                        .build());
            }
        } catch (Exception e) {
            log.error("시나리오 질문 시작 중 에러 발생: {}", e.getMessage(), e);
            rb.say(new Say.Builder("시스템 오류가 발생했습니다.")
                    .language(Say.Language.KO_KR)
                    .voice(Say.Voice.POLLY_SEOYEON)
                    .build());
        }

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    /**
     * [2-1단계] 시나리오 기반 순차 질문 처리
     * 이전 답변을 저장하고 다음 질문을 읽어줍니다. 모든 질문이 끝나면 완료 메시지를 재생합니다.
     */
    @PostMapping(value = "/voice/conversation", produces = "application/xml; charset=UTF-8")
    @ResponseBody
    @Transactional
    public ResponseEntity<String> handleConversation(
            @RequestParam(value = "SpeechResult", required = false) String speechResult,
            @RequestParam(value = "CallSid") String callSid,
            @RequestParam(value = "questionIdx", defaultValue = "0") int questionIdx) {

        VoiceResponse.Builder rb = new VoiceResponse.Builder();

        log.info("handleConversation 호출: callSid={}, questionIdx={}, speechResult={}",
            callSid, questionIdx, speechResult != null ? speechResult.substring(0, Math.min(50, speechResult.length())) : "null");

        try {
            // 1. CallSid로 Call 찾기
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isEmpty()) {
                log.warn("Call을 찾을 수 없음: callSid={}", callSid);
                rb.say(new Say.Builder("시스템 오류가 발생했습니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
                return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
            }

            Call call = callOpt.get();

            // 2. CallSchedule을 통해 Scenario 찾기
            Scenario scenario = null;
            if (call.getCallSchedule() != null) {
                scenario = call.getCallSchedule().getScenario();
            }
            
            if (scenario == null) {
                // 시나리오가 없으면 기존 방식(단순 STT)으로 진행
                log.info("시나리오가 없어 기존 방식으로 진행: callId={}", call.getCallId());
                rb.gather(new Gather.Builder()
                        .inputs(Collections.singletonList(Gather.Input.SPEECH))
                        .language(Gather.Language.KO_KR)
                        .speechTimeout(GATHER_SPEECH_TIMEOUT)
                        .timeout(GATHER_TIMEOUT)
                        .action(ngrokBaseUrl + "/api/twilio/voice/gather-speech")
                        .method(com.twilio.http.HttpMethod.POST)
                        .say(new Say.Builder("오늘 컨디션이 어떠신지 말씀해 주세요.")
                                .language(Say.Language.KO_KR)
                                .voice(Say.Voice.POLLY_SEOYEON)
                                .build())
                        .build());
                return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
            }

            // 3. 시나리오의 질문 목록 가져오기 (순서대로)
            List<ScenarioQuestion> questions = scenarioQuestionRepository
                    .findByScenarioOrderByQuestionOrderAsc(scenario);

            if (questions.isEmpty()) {
                rb.say(new Say.Builder("질문이 설정되지 않았습니다.")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
                return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
            }

            // 4. 이전 답변이 있다면 처리
            String previousContextualQuestion = null; // 이전에 실제로 물어본 변형된 질문
            log.info("답변 처리 시작: speechResult={}, questionIdx={}",
                speechResult != null && !speechResult.trim().isEmpty() ? "있음" : "없음", questionIdx);

            if (speechResult != null && !speechResult.trim().isEmpty() && questionIdx > 0) {
                // 이전 질문 텍스트 가져오기
                ScenarioQuestion previousQuestion = questions.get(questionIdx - 1);
                CareTarget careTarget = call.getCareTarget();

                // 이전에 저장된 변형된 질문 가져오기 (transcript에서)
                previousContextualQuestion = getLastQuestionFromTranscript(callSid);
                if (previousContextualQuestion == null || previousContextualQuestion.isEmpty()) {
                    // transcript에서 찾지 못하면 원래 질문 사용 (fallback)
                    previousContextualQuestion = previousQuestion.getQuestionText();
                }

                // 4-1. 긴급 상황 감지
                String scenarioPurpose = scenario.getDescription() != null ? scenario.getDescription() : "";
                EmergencyDetectionResult emergencyResult = emergencyDetectionService.detectEmergency(
                    speechResult, scenarioPurpose);

                if (emergencyResult.isEmergency()) {
                    // 긴급 상황: 시나리오 중단 및 대응 멘트 송출
                    rb.say(new Say.Builder(emergencyResult.getEmergencyMessage())
                            .language(Say.Language.KO_KR)
                            .voice(Say.Voice.POLLY_SEOYEON)
                            .build());

                    // 답변 저장 (변형된 질문 사용)
                    saveAnswer(callSid, previousContextualQuestion, speechResult);

                    // 긴급 상황 알림 전송 (WebSocket + DB 저장)
                    sendEmergencyNotification(call, careTarget, speechResult, emergencyResult.getEmergencyMessage());

                    log.warn("긴급 상황 감지: callSid={}, careTargetId={}, answer={}",
                        callSid, careTarget != null ? careTarget.getCareTargetId() : null, speechResult);

                    // 통화 종료
                    return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
                }

                // 4-2. 답변 저장 및 벡터 저장 (변형된 질문 사용)
                saveAnswer(callSid, previousContextualQuestion, speechResult);

                // VectorStore에 저장 (임베딩은 자동 생성됨)
                // 벡터 저장 시에는 원래 질문 사용 (메타데이터용)
                if (careTarget != null) {
                    callVectorStoreService.saveAnswerVector(
                        careTarget.getCareTargetId(),
                        previousQuestion.getQuestionText(), // 원래 질문 (메타데이터용)
                        speechResult,
                        null, // embedding은 VectorStore가 자동 생성
                        java.time.LocalDateTime.now()
                    );
                    log.debug("벡터 저장 완료: careTargetId={}, questionIdx={}",
                        careTarget.getCareTargetId(), questionIdx);
                }
            }

            // 5. 첫 번째 질문인 경우 질문만 먼저 저장하지 않음 (변형된 질문 생성 후 저장)

            // 6. 다음 질문이 있는지 확인
            log.info("다음 질문 확인: questionIdx={}, questions.size()={}", questionIdx, questions.size());

            if (questionIdx < questions.size()) {
                ScenarioQuestion nextQuestion = questions.get(questionIdx);
                String originalQuestion = nextQuestion.getQuestionText();
                CareTarget careTarget = call.getCareTarget();

                log.info("다음 질문 생성 시작: questionIdx={}, originalQuestion={}", questionIdx, originalQuestion);

                // 6-1. 동적 질문 생성 (과거 기록 참고)
                String contextualQuestion = questionGenerationService.generateContextualQuestion(
                    originalQuestion,
                    careTarget,
                    questionIdx > 0 && speechResult != null ? speechResult : null
                );

                log.info("변형된 질문 생성 완료: questionIdx={}, contextualQuestion={}", questionIdx, contextualQuestion);

                // 6-2. 변형된 질문을 transcript에 저장 (실제로 물어본 질문)
                updateTranscriptWithQuestion(callSid, contextualQuestion);

                // 6-3. 변형된 질문으로 음성 송출
                String nextActionUrl = ngrokBaseUrl + "/api/twilio/voice/conversation?questionIdx=" + (questionIdx + 1);
                log.info("다음 질문 송출: questionIdx={}, nextQuestionIdx={}, actionUrl={}",
                    questionIdx, questionIdx + 1, nextActionUrl);

                rb.gather(new Gather.Builder()
                        .inputs(Collections.singletonList(Gather.Input.SPEECH))
                        .language(Gather.Language.KO_KR)
                        .speechTimeout(GATHER_SPEECH_TIMEOUT)
                        .timeout(GATHER_TIMEOUT)
                        .action(nextActionUrl)
                        .method(com.twilio.http.HttpMethod.POST)
                        .say(new Say.Builder(contextualQuestion)
                                .language(Say.Language.KO_KR)
                                .voice(Say.Voice.POLLY_SEOYEON)
                                .build())
                        .build());
            } else {
                // 모든 질문 완료 - 요청사항 질문
                rb.say(new Say.Builder("추가적으로 하실 말씀이나 요청사항이 있으신가요?")
                        .language(Say.Language.KO_KR)
                        .voice(Say.Voice.POLLY_SEOYEON)
                        .build());
                
                rb.gather(new Gather.Builder()
                        .inputs(Collections.singletonList(Gather.Input.SPEECH))
                        .language(Gather.Language.KO_KR)
                        .speechTimeout(GATHER_SPEECH_TIMEOUT)
                        .timeout(GATHER_TIMEOUT)
                        .action(ngrokBaseUrl + "/api/twilio/voice/final-request")
                        .method(com.twilio.http.HttpMethod.POST)
                        .build());
            }

        } catch (Exception e) {
            log.error("시나리오 질문 처리 중 에러: {}", e.getMessage(), e);
            rb.say(new Say.Builder("시스템 오류가 발생했습니다.")
                    .language(Say.Language.KO_KR)
                    .voice(Say.Voice.POLLY_SEOYEON)
                    .build());
        }

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    /**
     * [2-2단계] 시나리오가 없을 때 일반 음성 인식(STT) 결과 처리
     * 시나리오가 없는 경우 1단계에서 이 엔드포인트로 연결되며, 사용자의 음성을 텍스트로 변환하여 CallRecording에 저장합니다.
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

        // 요청사항 질문
        rb.say(new Say.Builder("추가적으로 하실 말씀이나 요청사항이 있으신가요?")
                .language(Say.Language.KO_KR)
                .voice(Say.Voice.POLLY_SEOYEON)
                .build());
        
        rb.gather(new Gather.Builder()
                .inputs(Collections.singletonList(Gather.Input.SPEECH))
                .language(Gather.Language.KO_KR)
                .speechTimeout(GATHER_SPEECH_TIMEOUT)
                .timeout(GATHER_TIMEOUT)
                .action(ngrokBaseUrl + "/api/twilio/voice/final-request")
                .method(com.twilio.http.HttpMethod.POST)
                .build());

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    /**
     * [3단계] 요청사항 답변 처리 및 통화 종료
     * 모든 질문 완료 후 마지막 요청사항을 물어보고 답변을 받은 후 통화를 종료합니다.
     */
    @PostMapping(value = "/voice/final-request", produces = "application/xml; charset=UTF-8")
    @ResponseBody
    @Transactional
    public ResponseEntity<String> handleFinalRequest(
            @RequestParam(value = "SpeechResult", required = false) String speechResult,
            @RequestParam(value = "CallSid") String callSid) {

        VoiceResponse.Builder rb = new VoiceResponse.Builder();

        try {
            // 요청사항 답변이 있으면 저장
            if (speechResult != null && !speechResult.trim().isEmpty()) {
                Optional<Call> callOpt = callRepository.findByCallSid(callSid);
                if (callOpt.isPresent()) {
                    Call call = callOpt.get();
                    Optional<CallRecording> recordingOpt = callRecordingRepository.findByCall_CallId(call.getCallId());
                    
                    if (recordingOpt.isPresent()) {
                        CallRecording recording = recordingOpt.get();
                        String existingTranscript = recording.getTranscript() != null ? recording.getTranscript() : "";
                        String newTranscript = existingTranscript.isEmpty()
                                ? "요청사항: " + speechResult
                                : existingTranscript + "\n\n요청사항: " + speechResult;
                        recording.updateTranscript(newTranscript);
                        callRecordingRepository.save(recording);
                        log.info("요청사항 저장 완료: callSid={}, request={}", callSid, speechResult);
                    }
                }
            }
        } catch (Exception e) {
            log.error("요청사항 저장 실패: callSid={}, error={}", callSid, e.getMessage(), e);
        }

        // 통화 종료 처리: end_time과 duration 업데이트
        Optional<Call> callForUpdate = callRepository.findByCallSid(callSid);
        callForUpdate.ifPresent(c -> {
            c.completeCall();
            callRepository.save(c);
            log.info("통화 종료 처리 완료: callId={}, duration={}초", c.getCallId(), c.getDuration());
        });

        // 종료 메시지
        rb.say(new Say.Builder("알겠습니다. 다음 전화 예정일에 연락드리겠습니다.")
                .language(Say.Language.KO_KR)
                .voice(Say.Voice.POLLY_SEOYEON)
                .build());

        return ResponseEntity.ok().body(cleanXml(rb.build().toXml()));
    }

    /**
     * [4단계] Twilio 녹음 완료 웹훅 엔드포인트
     * TwilioService.makeCall()에서 setRecordingStatusCallback으로 설정된 콜백입니다.
     * 녹음이 완료되면 Twilio가 자동으로 호출하며, 녹음 파일을 다운로드하여 저장하고 CallRecording의 file 필드를 업데이트합니다.
     */
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
            String storagePath = downloadAndSaveRecording(recordingUrl);
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

            Optional<CallRecording> existingOpt = callRecordingRepository.findByCall_CallId(call.getCallId());
            
            CallRecording callRecording;
            if (existingOpt.isPresent()) {
                // 기존 CallRecording이 있으면 file만 업데이트하고 transcript는 유지
                callRecording = existingOpt.get();
                callRecording.updateFile(savedFile);
                // transcript는 이미 대화 내용이 저장되어 있으므로 유지
            } else {
                // 기존 CallRecording이 없으면 새로 생성
                callRecording = CallRecording.builder()
                        .call(call)
                        .file(savedFile)
                        .transcript(call.getSummary())
                        .build();
            }

            callRecordingRepository.save(callRecording);

            log.info("녹음 파일 저장 완료: callId={}, recordingId={}, fileId={}, storagePath={}",
                    call.getCallId(), callRecording.getRecordingId(), savedFile.getFileId(), storagePath);

            // [추가] 통화 분석 및 위험도 점수 생성 (AI 요약 포함)
            try {
                log.info("통화 분석 시작: callId={}", call.getCallId());
                callAnalysisService.analyze(call.getCallId());
                log.info("통화 분석 완료: callId={}", call.getCallId());
            } catch (Exception e) {
                log.error("통화 분석 중 오류 발생: callId={}, error={}", call.getCallId(), e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("녹음 파일 저장 실패: callSid={}, error={}", callSid, e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * [테스트용] 수신 SMS/MMS 웹훅 - Twilio 콘솔에서 "A MESSAGE COMES IN" URL로 설정
     * POST /api/twilio/sms/inbound
     */
    @PostMapping("/sms/inbound")
    @Transactional
    public ResponseEntity<String> handleInboundSms(
            HttpServletRequest request,
            @RequestParam(value = "MessageSid") String messageSid,
            @RequestParam(value = "From") String from,
            @RequestParam(value = "To") String to,
            @RequestParam(value = "Body", required = false, defaultValue = "") String body) {

        log.info("수신 SMS/MMS: messageSid={}, from={}, to={}, body={}", messageSid, from, to, body);

        List<String> savedPaths = new ArrayList<>();
        List<String> contentTypes = new ArrayList<>();

        try {
            Long organizationId = organizationRepository.findAll().stream()
                    .findFirst()
                    .map(Organization::getOrganizationId)
                    .orElse(null);

            int numMedia = 0;
            String numMediaStr = request.getParameter("NumMedia");
            if (numMediaStr != null && !numMediaStr.isEmpty()) {
                numMedia = Integer.parseInt(numMediaStr);
            }

            for (int i = 0; i < numMedia; i++) {
                String mediaUrl = request.getParameter("MediaUrl" + i);
                String mediaContentType = request.getParameter("MediaContentType" + i);
                if (mediaUrl != null && !mediaUrl.isEmpty()) {
                    String path = downloadAndSaveMmsMedia(mediaUrl);
                    if (path != null) {
                        savedPaths.add(path);
                        contentTypes.add(mediaContentType != null ? mediaContentType : "");
                        if (organizationId != null) {
                            uploadFileService.createUploadFileForExistingPath(path, organizationId, mediaContentType);
                        }
                    }
                }
            }

            // Body에 포함된 이미지 URL 다운로드 (기존 UploadFileService 활용)
            if (organizationId != null && body != null && !body.isBlank()) {
                Pattern urlPattern = Pattern.compile("https?://[^\\s]+");
                Matcher matcher = urlPattern.matcher(body);
                while (matcher.find()) {
                    String url = matcher.group().replaceAll("[.,;:!?)]+$", "");
                    String path = uploadFileService.saveFromUrl(url, organizationId, 0L);
                    if (path != null) {
                        savedPaths.add(path);
                        contentTypes.add("image/jpeg");
                    }
                }
            }

            String mediaPathsStr = savedPaths.isEmpty() ? null : String.join(",", savedPaths);
            String mediaTypesStr = contentTypes.isEmpty() ? null : String.join(",", contentTypes);

            InboundSms inboundSms = inboundSmsRepository.save(InboundSms.builder()
                    .messageSid(messageSid)
                    .fromNumber(from)
                    .toNumber(to)
                    .body(body != null ? body : "")
                    .mediaPaths(mediaPathsStr)
                    .mediaContentTypes(mediaTypesStr)
                    .build());

            // CareTarget 매칭 (From 번호)
            CareTarget careTarget = findCareTargetByFromNumber(from);

            // SmsType 분류 (SMS_AI_MEMO, SCHEDULE_CHANGE, PRESCRIPTION, UNKNOWN)
            SmsType smsType = smsTypeService.classify(inboundSms);
            inboundSms.updateClassification(careTarget, smsType, LocalDateTime.now());

            // SCHEDULE_CHANGE: 예약 변경 처리 (개인만, 그룹/파싱실패는 TODO 보류)
            if (smsType == SmsType.SCHEDULE_CHANGE) {
                try {
                    scheduleChangeService.processScheduleChange(inboundSms);
                } catch (Exception e) {
                    log.warn("예약 변경 처리 실패 inboundSmsId={}: {}", inboundSms.getInboundSmsId(), e.getMessage());
                }
            }

            // PRESCRIPTION: 처방전 이미지 OCR/LLM 분석 및 DB 저장
            if (smsType == SmsType.PRESCRIPTION) {
                try {
                    prescriptionService.processPrescription(inboundSms);
                } catch (Exception e) {
                    log.warn("처방전 분석 처리 실패 inboundSmsId={}: {}", inboundSms.getInboundSmsId(), e.getMessage());
                }
            }

            log.info("수신 SMS/MMS 저장 완료: messageSid={}, mediaCount={}, smsType={}, careTargetId={}",
                    messageSid, savedPaths.size(), smsType, careTarget != null ? careTarget.getCareTargetId() : null);
        } catch (Exception e) {
            log.error("수신 SMS/MMS 처리 실패: messageSid={}, error={}", messageSid, e.getMessage(), e);
        }

        // 204 No Content: 회신하지 않음 (200+TwiML 시 "Sent from your Twilio trial account - ..." 자동 회신됨)
        return ResponseEntity.noContent().build();
    }

    /** From 번호로 CareTarget 매칭 (Twilio 형식 +8210... → 010... 비교) */
    private CareTarget findCareTargetByFromNumber(String fromNumber) {
        if (fromNumber == null || fromNumber.isBlank()) {
            return null;
        }
        String normalized = fromNumber.replaceAll("[^0-9]", "");
        if (normalized.startsWith("82") && normalized.length() >= 10) {
            normalized = "0" + normalized.substring(2);
        } else if (!normalized.startsWith("0") && normalized.length() >= 9) {
            normalized = "0" + normalized;
        }
        final String target = normalized;
        return careTargetRepository.findAll().stream()
                .filter(t -> t.getTargetPhone() != null
                        && t.getTargetPhone().replaceAll("[^0-9]", "").equals(target))
                .findFirst()
                .orElse(null);
    }

    private String downloadAndSaveMmsMedia(String mediaUrl) {
        try {
            String auth = twilioAccountSid + ":" + twilioAuthToken;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            URL url = new URL(mediaUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestProperty("Authorization", "Basic " + encodedAuth);

            String contentType = connection.getContentType();
            String ext = "bin";
            if (contentType != null) {
                if (contentType.contains("jpeg") || contentType.contains("jpg")) ext = "jpg";
                else if (contentType.contains("png")) ext = "png";
                else if (contentType.contains("gif")) ext = "gif";
                else if (contentType.contains("webp")) ext = "webp";
                else if (contentType.contains("video") || contentType.contains("mp4")) ext = "mp4";
            }

            String storagePath = "MMS/" + UUID.randomUUID() + "." + ext;
            Path filePath = Paths.get("uploads", storagePath);
            Files.createDirectories(filePath.getParent());

            try (InputStream inputStream = connection.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("MMS 미디어 다운로드 완료: url={}, path={}", mediaUrl, storagePath);
            return storagePath;
        } catch (Exception e) {
            log.error("MMS 미디어 다운로드 실패: url={}, error={}", mediaUrl, e.getMessage(), e);
            return null;
        }
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

    private String downloadAndSaveRecording(String recordingUrl) {
        try {
            String auth = twilioAccountSid + ":" + twilioAuthToken;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            URL url = new URL(recordingUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestProperty("Authorization", "Basic " + encodedAuth);

            String storagePath = "CALL_LOG/" + UUID.randomUUID() + ".mp3";
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
                    .summary(null)  // summary에 저장하지 않음
                    .callerId(finalTwilioPhone)  // 전화번호 저장
                    .callSid(callSid)  // Twilio CallSid 저장
                    .build());

            // stt.txt 파일 저장 제거, CallRecording만 생성
            callRecordingRepository.save(CallRecording.builder()
                    .call(call)
                    .file(null)  // 파일은 나중에 녹음 파일 저장될 때 설정됨
                    .transcript(speechResult)
                    .build());
        } catch (Exception e) {
            log.error("saveCallData 에러: {}", e.getMessage(), e);
        }
    }

    /**
     * 질문을 transcript에 저장 (변형된 질문 사용)
     */
    private void updateTranscriptWithQuestion(String callSid, String contextualQuestion) {
        try {
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isEmpty()) {
                return;
            }

            Call call = callOpt.get();
            
            // CallRecording이 있으면 질문 추가, 없으면 생성
            Optional<CallRecording> recordingOpt = callRecordingRepository.findByCall_CallId(call.getCallId());
            
            if (recordingOpt.isPresent()) {
                CallRecording recording = recordingOpt.get();
                String existingTranscript = recording.getTranscript() != null ? recording.getTranscript() : "";
                // 기존 transcript가 있으면 새 줄로 추가, 없으면 질문만 저장
                String newTranscript = existingTranscript.isEmpty()
                        ? "AI: " + contextualQuestion
                        : existingTranscript + "\n\nAI: " + contextualQuestion;
                recording.updateTranscript(newTranscript);
                callRecordingRepository.save(recording);
                log.info("질문 저장 (transcript): callSid={}, question={}", callSid, contextualQuestion);
            } else {
                // CallRecording이 없으면 새로 생성
                CallRecording recording = CallRecording.builder()
                        .call(call)
                        .file(null)  // 녹음 파일은 나중에 저장될 때 설정됨
                        .transcript("AI: " + contextualQuestion)
                        .build();
                callRecordingRepository.save(recording);
                log.info("첫 번째 질문 저장 (transcript): callSid={}, question={}", callSid, contextualQuestion);
            }
        } catch (Exception e) {
            log.error("질문 저장 실패 (transcript): callSid={}, error={}", callSid, e.getMessage(), e);
        }
    }

    /**
     * transcript에서 마지막 질문 가져오기
     */
    private String getLastQuestionFromTranscript(String callSid) {
        try {
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isEmpty()) {
                return null;
            }

            Call call = callOpt.get();
            Optional<CallRecording> recordingOpt = callRecordingRepository.findByCall_CallId(call.getCallId());

            if (recordingOpt.isPresent()) {
                CallRecording recording = recordingOpt.get();
                String transcript = recording.getTranscript();
                if (transcript != null && !transcript.isEmpty()) {
                    // "AI: "로 시작하는 마지막 줄 찾기
                    String[] lines = transcript.split("\n");
                    for (int i = lines.length - 1; i >= 0; i--) {
                        String line = lines[i].trim();
                        if (line.startsWith("AI: ")) {
                            return line.substring(4); // "AI: " 제거
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("transcript에서 질문 가져오기 실패: callSid={}, error={}", callSid, e.getMessage(), e);
        }
        return null;
    }

    /**
     * 답변 저장 (CallRecording에 저장) - 대화 형식으로 저장
     * 형식: "AI: 질문\n케어대상: 답변"
     */
    private void saveAnswer(String callSid, String questionText, String answer) {
        try {
            Optional<Call> callOpt = callRepository.findByCallSid(callSid);
            if (callOpt.isEmpty()) {
                log.warn("Call을 찾을 수 없어 답변 저장 실패: callSid={}", callSid);
                return;
            }

            Call call = callOpt.get();
            
            // CallRecording이 있으면 transcript에 추가, 없으면 생성
            Optional<CallRecording> recordingOpt = callRecordingRepository.findByCall_CallId(call.getCallId());
            
            // 대화 형식으로 저장: "AI: 질문\n케어대상: 답변"
            String conversationEntry = String.format("AI: %s\n케어대상: %s", questionText, answer);
            
            if (recordingOpt.isPresent()) {
                CallRecording recording = recordingOpt.get();
                // 기존 transcript에 추가
                String existingTranscript = recording.getTranscript() != null ? recording.getTranscript() : "";
                
                // 기존 transcript가 "AI: 질문" 형식으로 끝나면 답변만 추가, 아니면 전체 대화 추가
                String newTranscript;
                if (existingTranscript.endsWith(questionText) || existingTranscript.contains("AI: " + questionText)) {
                    // 이미 질문이 저장되어 있으면 답변만 추가
                    newTranscript = existingTranscript + "\n케어대상: " + answer;
                } else {
                    // 질문이 없으면 전체 대화 추가
                    newTranscript = existingTranscript.isEmpty() 
                            ? conversationEntry
                            : existingTranscript + "\n\n" + conversationEntry;
                }
                recording.updateTranscript(newTranscript);
                callRecordingRepository.save(recording);
            } else {
                // CallRecording이 없으면 새로 생성
                CallRecording recording = CallRecording.builder()
                        .call(call)
                        .file(null)  // 녹음 파일은 나중에 저장될 때 설정됨
                        .transcript(conversationEntry)
                        .build();
                callRecordingRepository.save(recording);
            }
            
            log.info("답변 저장 완료: callSid={}, question={}, answer={}", callSid, questionText, answer);
        } catch (Exception e) {
            log.error("답변 저장 실패: callSid={}, question={}, error={}", callSid, questionText, e.getMessage(), e);
        }
    }

    /**
     * 긴급 상황 발생 시 조직 공유 알림 전송
     * 같은 Call에 대해 하나의 조직 공유 알림만 생성 (user_id = null)
     * 조직별 WebSocket 토픽(/topic/org/{organizationId})으로 브로드캐스트
     */
    private void sendEmergencyNotification(Call call, CareTarget careTarget,
                                          String emergencyAnswer, String emergencyMessage) {
        try {
            Organization organization = call.getOrganization();
            if (organization == null) {
                log.warn("Organization을 찾을 수 없어 긴급 알림 전송 실패: callId={}", call.getCallId());
                return;
            }

            // 같은 Call에 대해 이미 긴급 알림이 생성되었는지 확인
            List<com.carepilot.domain.notification.Notification> existingNotifications =
                notificationRepository.findByCallIdAndType(call.getCallId(), NotificationType.EMERGENCY);

            if (!existingNotifications.isEmpty()) {
                log.info("이미 긴급 알림이 생성되어 중복 방지: callId={}, 기존 알림 개수={}",
                    call.getCallId(), existingNotifications.size());
                return;
            }

            // 알림 제목 및 내용 구성
            String careTargetName = careTarget != null ? careTarget.getName() : "알 수 없음";
            String title = String.format("긴급 상황 발생: %s", careTargetName);
            String description = String.format("케어대상자 '%s'의 통화 중 긴급 상황이 감지되었습니다.\n\n" +
                    "감지된 답변: %s\n" +
                    "대응 메시지: %s",
                    careTargetName, emergencyAnswer, emergencyMessage);

            // 조직 공유 알림 생성 (user_id = null, 하나만 생성)
            // WebSocket은 조직별 토픽으로 브로드캐스트
            notificationService.createOrganizationNotification(
                organization.getOrganizationId(),
                NotificationType.EMERGENCY,
                title,
                description,
                RiskLevel.CRITICAL,
                call,
                careTarget
            );

            log.info("긴급 알림 생성 완료: organizationId={}, careTargetName={}",
                organization.getOrganizationId(), careTargetName);
        } catch (Exception e) {
            log.error("긴급 알림 전송 중 오류 발생: callId={}, error={}",
                call.getCallId(), e.getMessage(), e);
        }
    }
}


