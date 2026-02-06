package com.carepilot.service.call.emergency;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.config.Doctor;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskSourceType;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.task.TaskRepository;
import com.carepilot.service.call.TwilioService;
import com.carepilot.service.config.ai.AiConfigService;
import com.carepilot.service.notification.NotificationService;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.util.PhoneNumberUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class EmergencyNotificationServiceImpl implements EmergencyNotificationService {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    private final TwilioService twilioService;

    @Override
    public void handleEmergency(Call call, CareTarget careTarget,
                               String emergencyAnswer, String emergencyMessage) {
        try {
            Organization organization = call.getOrganization();
            if (organization == null) {
                log.warn("Organization을 찾을 수 없어 긴급 알림 전송 실패: callId={}", call.getCallId());
                return;
            }

            // 1. 중복 알림 확인 및 알림 생성
            Notification notification = createEmergencyNotificationIfNotExists(
                    call, careTarget, emergencyAnswer, emergencyMessage, organization);

            if (notification == null) {
                return; // 이미 알림이 있으면 종료
            }

            // 2. Task 생성 (자동화 여부에 따라 다르게 처리)
            createEmergencyTask(call, careTarget, emergencyAnswer, 
                               emergencyMessage, notification, organization);

        } catch (Exception e) {
            log.error("긴급 상황 처리 중 오류 발생: callId={}, error={}",
                    call.getCallId(), e.getMessage(), e);
        }
    }

    /**
     * 긴급 알림 생성 (중복 방지)
     */
    private Notification createEmergencyNotificationIfNotExists(
            Call call, CareTarget careTarget, String emergencyAnswer, 
            String emergencyMessage, Organization organization) {
        
        // 같은 Call에 대해 이미 긴급 알림이 생성되었는지 확인
        List<Notification> existingNotifications =
                notificationRepository.findByCallIdAndType(call.getCallId(), NotificationType.EMERGENCY);

        if (!existingNotifications.isEmpty()) {
            log.info("이미 긴급 알림이 생성되어 중복 방지: callId={}, 기존 알림 개수={}",
                    call.getCallId(), existingNotifications.size());
            return null;
        }

        // 알림 제목 및 내용 구성
        String careTargetName = careTarget != null ? careTarget.getName() : "알 수 없음";
        String title = String.format("긴급 상황 발생: %s", careTargetName);
        String description = String.format("케어대상자 '%s'의 통화 중 긴급 상황이 감지되었습니다.\n\n" +
                        "감지된 답변: %s\n" +
                        "대응 메시지: %s",
                careTargetName, emergencyAnswer, emergencyMessage);

        // 조직 공유 알림 생성 (user_id = null, 하나만 생성)
        Notification notification = notificationService.createOrganizationNotification(
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

        return notification;
    }

    /**
     * 긴급 상황 Task 생성 (자동화 여부에 따라 다르게 처리)
     */
    private void createEmergencyTask(Call call, CareTarget careTarget,
                                    String emergencyAnswer, String emergencyMessage,
                                    Notification notification, Organization organization) {
        try {
            // 같은 Call에 대해 이미 Task가 생성되었는지 확인
            List<Task> existingTasks = taskRepository.findByCall_CallId(call.getCallId());

            boolean hasEmergencyTask = existingTasks.stream()
                    .anyMatch(task -> task.getType() == TaskType.RISK_FOLLOWUP);

            if (hasEmergencyTask) {
                log.info("이미 위험 후속조치 작업이 존재하여 생성하지 않음: callId={}", call.getCallId());
                return;
            }

            String careTargetName = careTarget != null ? careTarget.getName() : "알 수 없음";
            Doctor doctor = careTarget != null ? careTarget.getDoctor() : null;

            // 항상 의료진에게 SMS 전송 (의료진 정보가 있을 때만)
            if (doctor != null && doctor.getPhone() != null && !doctor.getPhone().trim().isEmpty()) {
                try {
                    String smsMessage = String.format(
                            "[케어파일럿 긴급 알림]\n\n" +
                                    "환자: %s\n" +
                                    "긴급 상황: %s\n\n" +
                                    "즉시 확인이 필요합니다.",
                            careTargetName, emergencyAnswer
                    );

                    String parsedPhone = PhoneNumberUtil.parsePhoneNumber(doctor.getPhone());
                    String messageSid = twilioService.sendSms(parsedPhone, smsMessage);
                    log.info("긴급 상황 SMS 전송 완료: doctorPhone={}, messageSid={}, callId={}",
                            doctor.getPhone(), messageSid, call.getCallId());
                } catch (Exception e) {
                    log.error("긴급 상황 SMS 전송 실패: doctorPhone={}, callId={}, error={}",
                            doctor.getPhone(), call.getCallId(), e.getMessage(), e);
                    // SMS 실패해도 Task는 생성
                }
            } else {
                log.warn("담당 의료진 정보 또는 전화번호가 없어 SMS를 전송할 수 없습니다: callId={}", call.getCallId());
            }

            String doctorInfo = formatDoctorInfo(doctor);

            // Task는 항상 USER, WAITING으로 생성
            Task emergencyTask = createEmergencyTask(
                    call, careTarget, careTargetName, emergencyAnswer, emergencyMessage,
                    notification, organization, doctor, doctorInfo);

            taskRepository.save(emergencyTask);
            log.info("긴급 상황 위험 후속조치 작업 생성 완료: taskId={}, callId={}, careTargetId={}, status={}",
                    emergencyTask.getTaskId(), call.getCallId(),
                    careTarget != null ? careTarget.getCareTargetId() : null,
                    emergencyTask.getStatus());

        } catch (Exception e) {
            log.error("긴급 상황 위험 후속조치 작업 생성 실패: callId={}, error={}",
                    call.getCallId(), e.getMessage(), e);
        }
    }

    /**
     * 긴급 상황 Task 생성 (항상 USER, WAITING으로 고정)
     */
    private Task createEmergencyTask(Call call, CareTarget careTarget,
                                    String careTargetName, String emergencyAnswer,
                                    String emergencyMessage, Notification notification,
                                    Organization organization, Doctor doctor, String doctorInfo) {
        String smsStatus = "";
        if (doctor != null && doctor.getPhone() != null && !doctor.getPhone().trim().isEmpty()) {
            smsStatus = String.format("\n\n[SMS 전송 완료] 담당 의료진(%s)에게 긴급 알림이 전송되었습니다.", doctor.getPhone());
        } else {
            smsStatus = "\n\n[참고] 담당 의료진 정보 또는 전화번호가 없어 SMS를 전송할 수 없습니다.";
        }

        Task emergencyTask = Task.builder()
                .organization(organization)
                .sourceType(TaskSourceType.USER)  // 항상 USER로 고정
                .careTarget(careTarget)
                .title(String.format("의료진 호출: %s", careTargetName))
                .description(String.format(
                        "케어대상자 '%s'의 긴급 상황으로 인한 의료진 호출이 필요합니다.\n\n" +
                                "긴급 상황 내용:\n%s\n\n" +
                                "대응 메시지: %s\n\n" +
                                "=== 담당 의료진 호출 정보 ===\n%s%s",
                        careTargetName, emergencyAnswer, emergencyMessage, doctorInfo, smsStatus))
                .type(TaskType.RISK_FOLLOWUP)
                .priority(Priority.HIGH)
                .status(TaskStatus.WAITING)  // 항상 WAITING으로 고정
                .createdBy(null)
                .assignedTo(null)
                .call(call)
                .notification(notification)
                .build();

        log.info("긴급 상황 작업 생성 완료: taskId={}, callId={}, sourceType=USER, status=WAITING",
                emergencyTask.getTaskId(), call.getCallId());

        return emergencyTask;
    }

    /**
     * 의료진 정보 포맷팅
     */
    private String formatDoctorInfo(Doctor doctor) {
        if (doctor == null) {
            return "담당 의료진 정보 없음";
        }

        return String.format(
                "담당 의료진: %s\n" +
                        "전화번호: %s\n" +
                        "전문과목: %s",
                doctor.getName() != null ? doctor.getName() : "이름 없음",
                doctor.getPhone() != null ? doctor.getPhone() : "번호 없음",
                doctor.getSpecialty() != null ? doctor.getSpecialty() : "과목 없음"
        );
    }
}

