package com.carepilot.dto.call;

import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleTargetType;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.enums.Priority;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class ScheduleResponseDTO {
    private Long scheduleId;
    private Long careTargetId;
    private Long groupId;        // 그룹 ID (그룹 스케줄인 경우)
    private String scheduledTime;
    private String nextRunAt;  // 다음 실행 시각 (캘린더 표시용)
    private String careTargetName;
    private String targetType;
    private String targetTypeLabel;
    private String targetGroupName;
    private Long scenarioId;     // 통화 시 사용 시나리오 (선택)
    private String type;         // 인희성, 반복 등
    private String typeLabel;    // 한국어
    private String priority;     // 높음(Orange), 보통(Blue), 긴급(Red)
    private String priorityLabel; // 한국어
    private String status;       // 예약됨 등
    private String statusLabel;  // 한국어
    private String recurrence;   // 반복 주기 (weekly, daily)
    private String recurrenceLabel;  // 한국어
    private String recurrenceEndDate;  // 반복 종료일
    private String memo;

    public static ScheduleResponseDTO from(CallSchedule schedule) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        ScheduleTargetType targetType = schedule.getTargetType();
        CareTargetGroup group = schedule.getGroup();

        // nextRunAt이 있으면 사용, 없으면 scheduledTime 사용
        LocalDateTime nextRunAtValue = schedule.getNextRunAt();
        if (nextRunAtValue == null) {
            nextRunAtValue = schedule.getScheduledTime();
        }

        // careTargetName: 개인 대상자면 이름, 그룹이면 그룹 이름
        String careTargetNameValue = null;
        if (schedule.getCareTarget() != null) {
            careTargetNameValue = schedule.getCareTarget().getName();
        } else if (group != null) {
            careTargetNameValue = group.getGroupName();
        }

        return ScheduleResponseDTO.builder()
                .scheduleId(schedule.getScheduleId())
                .careTargetId(schedule.getCareTarget() != null ? schedule.getCareTarget().getCareTargetId() : null)
                .groupId(group != null ? group.getGroupId() : null)
                .scheduledTime(schedule.getScheduledTime() != null ? schedule.getScheduledTime().format(formatter) : null)
                .nextRunAt(nextRunAtValue != null ? nextRunAtValue.format(formatter) : null)
                .careTargetName(careTargetNameValue)
                .targetType(targetType != null ? targetType.name() : null)
                .targetTypeLabel(mapTargetTypeLabel(targetType))
                .targetGroupName(group != null ? group.getGroupName() : null)
                .scenarioId(schedule.getScenario() != null ? schedule.getScenario().getScenarioId() : null)
                .type(schedule.getType().name())
                .typeLabel(mapTypeLabel(schedule.getType()))
                .priority(schedule.getPriority().name())
                .priorityLabel(mapPriorityLabel(schedule.getPriority()))
                .status(schedule.getStatus().name())
                .statusLabel(mapStatusLabel(schedule.getStatus()))
                .recurrence(schedule.getRecurrence() != null ? schedule.getRecurrence().name() : null)
                .recurrenceLabel(mapRecurrenceLabel(schedule.getRecurrence()))
                .recurrenceEndDate(schedule.getRecurrenceEndDate() != null
                        ? schedule.getRecurrenceEndDate().format(dateTimeFormatter) : null)
                .memo(schedule.getMemo())
                .build();
    }

    private static String mapStatusLabel(ScheduleStatus status) {
        if (status == null) {
            return "-";
        }
        return switch (status) {
            case SCHEDULED -> "예약됨";
            case COMPLETED -> "완료됨";
            case CANCELLED -> "취소됨";
            case FAILED -> "실패";
            case RUNNING -> "실행중";
        };
    }

    private static String mapTypeLabel(ScheduleType type) {
        if (type == null) {
            return "-";
        }
        return switch (type) {
            case ONE_TIME -> "일회성";
            case RECURRING -> "반복";
        };
    }

    private static String mapTargetTypeLabel(ScheduleTargetType type) {
        if (type == null) {
            return "-";
        }
        return switch (type) {
            case CARE_TARGET -> "개별 대상자";
            case GROUP -> "그룹";
        };
    }

    private static String mapPriorityLabel(Priority priority) {
        if (priority == null) {
            return "-";
        }
        return switch (priority) {
            case URGENT -> "긴급";
            case HIGH -> "높음";
            case MEDIUM -> "보통";
            case LOW -> "낮음";
        };
    }

    private static String mapRecurrenceLabel(ScheduleRecurrence recurrence) {
        if (recurrence == null) {
            return "일회성";
        }
        return switch (recurrence) {
            case DAILY -> "일일";
            case WEEKLY -> "주간";
            case MONTHLY -> "월간";
        };
    }
}
