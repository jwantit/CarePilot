package com.carepilot.service.sms;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.sms.InboundSms;
import com.carepilot.domain.sms.SmsType;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.sms.InboundSmsRepository;
import com.carepilot.service.config.ai.AiConfigService;
import com.carepilot.service.prescription.PrescriptionService;
import com.carepilot.service.upload.UploadFileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Log4j2
public class SmsServiceImpl implements SmsService {

    private final OrganizationRepository organizationRepository;
    private final UploadFileService uploadFileService;
    private final InboundSmsRepository inboundSmsRepository;
    private final CareTargetRepository careTargetRepository;
    private final SmsTypeService smsTypeService;
    private final AiConfigService aiConfigService;
    private final ScheduleChangeService scheduleChangeService;
    private final PrescriptionService prescriptionService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    @Override
    @Transactional
    public void handleInboundSms(HttpServletRequest request, String messageSid, String from, String to, String body) {
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

            // SCHEDULE_CHANGE: 문자 자동화 ON이면 AI 처리, OFF이면 할일 목록에 수동 처리용 추가
            if (smsType == SmsType.SCHEDULE_CHANGE) {
                try {
                    Long orgId = careTarget != null ? careTarget.getOrganization().getOrganizationId() : organizationId;
                    boolean smsAutomationEnabled = orgId != null
                            && Boolean.TRUE.equals(aiConfigService.getAIConfig(orgId, "SMS_AUTOMATION").getIsEnabled());
                    if (smsAutomationEnabled) {
                        scheduleChangeService.processScheduleChange(inboundSms);
                    } else if (careTarget != null) {
                        scheduleChangeService.createManualScheduleChangeTask(inboundSms);
                        log.info("[SMS] 문자 자동화 OFF - 할일 목록에 수동 처리용 Task 추가 inboundSmsId={}", inboundSms.getInboundSmsId());
                    }
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

            // 케어대상 문자 도착 시 조직별 WebSocket으로 알림 (프론트 배지 숫자용, 폴링 없음)
            Long wsOrgId = (careTarget != null && careTarget.getOrganization() != null)
                    ? careTarget.getOrganization().getOrganizationId()
                    : organizationId;
            if (wsOrgId != null) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "NEW_INBOUND_SMS");
                payload.put("delta", 1);
                payload.put("from", from);
                payload.put("body", body != null ? body : "");
                payload.put("careTargetName", careTarget != null && careTarget.getName() != null ? careTarget.getName() : null);
                String topic = "/topic/org/" + wsOrgId;
                messagingTemplate.convertAndSend(topic, payload);
                log.debug("SMS 알림 WebSocket 전송: topic={}", topic);
            }
        } catch (Exception e) {
            log.error("수신 SMS/MMS 처리 실패: messageSid={}, error={}", messageSid, e.getMessage(), e);
        }
    }

    /**
     * From 번호로 CareTarget 매칭 (Twilio 형식 +8210... → 010... 비교)
     */
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

            URL url = URI.create(mediaUrl).toURL();
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
}
