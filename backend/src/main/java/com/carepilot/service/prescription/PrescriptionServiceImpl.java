package com.carepilot.service.prescription;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.prescription.Prescription;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.prescription.PrescriptionRepository;
import com.carepilot.service.upload.UploadFileService;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@Log4j2
public class PrescriptionServiceImpl implements PrescriptionService {

    private static final String BASE_DIR = "uploads";

    private static final String SYSTEM_PROMPT = """
            당신은 처방전 이미지를 분석하는 의료 도우미입니다.
            이미지를 보고 다음 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.

            {
              "prescribedDate": "YYYY-MM-DD",
              "diagnoses": [{"name": "진단명", "icdCode": "ICD코드"}],
              "medications": [{"name": "약명", "dosage": "1회 1정", "frequency": "1일 1회", "timing": "아침 식후", "duration": "30일분"}],
              "summary": "2~3문장 한글 요약 (환자명, 진단, 처방약, 복용법 등을 포함)"
            }

            - prescribedDate: 파싱 불가 시 null
            - diagnoses, medications: 없으면 빈 배열 []
            - summary: 반드시 한글로 요약
            """;

    private final PrescriptionRepository prescriptionRepository;
    private final UploadFileService uploadFileService;
    private final OrganizationRepository organizationRepository;

    private final ChatClient chatClient;

    public PrescriptionServiceImpl(
            PrescriptionRepository prescriptionRepository,
            UploadFileService uploadFileService,
            OrganizationRepository organizationRepository,
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.prescriptionRepository = prescriptionRepository;
        this.uploadFileService = uploadFileService;
        this.organizationRepository = organizationRepository;
        this.chatClient = chatClient;
    }

    @Override
    @Transactional
    public void processPrescription(InboundSms inboundSms) {
        if (inboundSms == null || inboundSms.getSmsType() != SmsType.PRESCRIPTION) {
            return;
        }
        CareTarget careTarget = inboundSms.getCareTarget();
        if (careTarget == null) {
            log.info("[Prescription] CareTarget 없음 inboundSmsId={}", inboundSms.getInboundSmsId());
            return;
        }

        String mediaPaths = inboundSms.getMediaPaths();
        if (mediaPaths == null || mediaPaths.isBlank()) {
            log.info("[Prescription] 미디어 없음 inboundSmsId={}", inboundSms.getInboundSmsId());
            return;
        }

        for (String path : mediaPaths.split(",")) {
            String trimmed = path.trim();
            if (trimmed.isEmpty()) continue;

            UploadFile uploadFile = getOrCreateUploadFile(trimmed);
            if (uploadFile == null) {
                log.warn("[Prescription] UploadFile 조회/생성 실패 path={}", trimmed);
                continue;
            }

            if (!isImagePath(trimmed)) {
                log.debug("[Prescription] 이미지 아님 스킵 path={}", trimmed);
                continue;
            }

            try {
                PrescriptionAnalysisResult result = analyzePrescriptionImage(trimmed);
                if (result == null) continue;

                prescriptionRepository.save(Prescription.builder()
                        .careTarget(careTarget)
                        .uploadFile(uploadFile)
                        .inboundSms(inboundSms)
                        .prescribedDate(result.prescribedDate)
                        .rawOcrText(null)
                        .diagnoses(result.diagnosesJson)
                        .medications(result.medicationsJson)
                        .summary(result.summary)
                        .analyzedAt(LocalDateTime.now())
                        .build());
                log.info("[Prescription] 저장 완료 careTargetId={}, path={}", careTarget.getCareTargetId(), trimmed);
            } catch (Exception e) {
                log.error("[Prescription] 분석/저장 실패 path={}: {}", trimmed, e.getMessage(), e);
            }
        }
    }

    private UploadFile getOrCreateUploadFile(String storagePath) {
        Optional<UploadFile> opt = uploadFileService.findUploadFileByStoragePath(storagePath);
        if (opt.isPresent()) return opt.get();

        Long orgId = organizationRepository.findAll().stream()
                .findFirst()
                .map(o -> o.getOrganizationId())
                .orElse(null);
        if (orgId == null) return null;

        return uploadFileService.createUploadFileForExistingPath(storagePath, orgId, "image/jpeg");
    }

    private boolean isImagePath(String path) {
        String lower = path.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
                || lower.endsWith(".gif") || lower.endsWith(".webp");
    }

    private PrescriptionAnalysisResult analyzePrescriptionImage(String storagePath) {
        if (chatClient == null) {
            log.warn("[Prescription] ChatClient 미설정");
            return null;
        }

        Path filePath = Paths.get(BASE_DIR, storagePath);
        if (!Files.exists(filePath)) {
            log.warn("[Prescription] 파일 없음: {}", filePath);
            return null;
        }

        try {
            FileSystemResource resource = new FileSystemResource(filePath.toFile());
            var mimeType = storagePath.toLowerCase().endsWith(".png")
                    ? MimeTypeUtils.IMAGE_PNG : MimeTypeUtils.IMAGE_JPEG;

            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(u -> u
                            .text("이 처방전 이미지를 분석하여 JSON으로만 응답하세요.")
                            .media(mimeType, resource))
                    .call()
                    .content();

            return parseAnalysisResponse(response);
        } catch (Exception e) {
            log.error("[Prescription] LLM 분석 실패 path={}: {}", storagePath, e.getMessage(), e);
            return null;
        }
    }

    private PrescriptionAnalysisResult parseAnalysisResponse(String response) {
        if (response == null || response.isBlank()) return null;
        try {
            String cleaned = response.trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start < 0 || end <= start) return null;
            cleaned = cleaned.substring(start, end + 1);

            JsonObject json = JsonParser.parseString(cleaned).getAsJsonObject();

            LocalDate prescribedDate = null;
            if (json.has("prescribedDate") && !json.get("prescribedDate").isJsonNull()) {
                String dateStr = json.get("prescribedDate").getAsString();
                if (dateStr != null && !dateStr.isBlank() && !"null".equalsIgnoreCase(dateStr)) {
                    try {
                        prescribedDate = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                    } catch (Exception ignored) {}
                }
            }

            String diagnosesJson = json.has("diagnoses") ? json.get("diagnoses").toString() : "[]";
            String medicationsJson = json.has("medications") ? json.get("medications").toString() : "[]";
            String summary = json.has("summary") && !json.get("summary").isJsonNull()
                    ? json.get("summary").getAsString() : null;

            return new PrescriptionAnalysisResult(prescribedDate, diagnosesJson, medicationsJson, summary);
        } catch (Exception e) {
            log.warn("[Prescription] JSON 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    private record PrescriptionAnalysisResult(
            LocalDate prescribedDate,
            String diagnosesJson,
            String medicationsJson,
            String summary
    ) {}
}
