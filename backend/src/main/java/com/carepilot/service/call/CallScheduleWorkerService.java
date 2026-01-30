package com.carepilot.service.call;

import com.carepilot.domain.caretarget.CareTargetGroupMap;
import com.carepilot.domain.call.CallSchedule;
import com.carepilot.domain.call.ScheduleRecurrence;
import com.carepilot.domain.call.ScheduleStatus;
import com.carepilot.domain.call.ScheduleType;
import com.carepilot.repository.call.CallScheduleRepository;
import com.carepilot.repository.caretarget.CareTargetGroupMapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

//스케줄 선점(Claim) 및 실행·완료 처리. 자동 콜 발신 로직을 포함.
@Service
@RequiredArgsConstructor
@Log4j2
public class CallScheduleWorkerService {

    private static final int POLL_BATCH_SIZE = 50;

    private final CallScheduleRepository callScheduleRepository;
    private final CareTargetGroupMapRepository careTargetGroupMapRepository;
    private final CallService callService;

    // 선점(Claim): 실행 대상 조회 및 RUNNING 처리
    // 실행 시각이 도래한 스케줄만 조회 후 RUNNING으로 선점. 선점된 scheduleId 목록 반환.
    @Transactional
    public List<Long> claimDueSchedules(LocalDateTime now) {
        List<CallSchedule> due = callScheduleRepository.findDueSchedules(
                now, PageRequest.of(0, POLL_BATCH_SIZE));
        if (!due.isEmpty()) {
            log.info("[폴링] findDueSchedules 조회 건수={}, now={}, scheduleIds={}",
                    due.size(), now,
                    due.stream()
                            .map(s -> String.format("(scheduleId=%d, next_run_at=%s, 개인=%s, groupId=%s)",
                                    s.getScheduleId(),
                                    s.getNextRunAt(),
                                    s.getCareTarget() != null ? s.getCareTarget().getTargetPhone() : null,
                                    s.getGroup() != null ? s.getGroup().getGroupId() : null))
                            .toList());
        }
        for (CallSchedule schedule : due) {
            schedule.ensureNextRunAtInitialized();
            schedule.markAsRunning();
        }
        callScheduleRepository.flush();
        return due.stream().map(CallSchedule::getScheduleId).toList();
    }

    // 실행 및 완료 처리: 발신 로직 호출 + next_run_at / COMPLETED 갱신
    // 선점된 스케줄 1건에 대해 발신 실행 후, 반복/단발에 따라 DB 상태 갱신
    @Transactional
    public void executeAndComplete(Long scheduleId, LocalDateTime executedAt) {
        CallSchedule schedule = callScheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null || schedule.getStatus() != ScheduleStatus.RUNNING) {
            log.info("[폴링] executeAndComplete 스킵 - scheduleId={}, 존재={}, status={}",
                    scheduleId, schedule != null, schedule != null ? schedule.getStatus() : null);
            return;
        }

        List<String> toList = collectTargetPhones(schedule);
        for (String to : toList) {
            callService.executeScheduledCall(to, schedule.getNextRunAt(), scheduleId);
        }

        if (schedule.getType() == ScheduleType.RECURRING && schedule.getRecurrence() != null) {
            LocalDateTime nextRunAt = calculateNextRunAt(
                    schedule.getNextRunAt(), schedule.getRecurrence(), schedule.getRecurrenceEndDate());
            if (nextRunAt != null) {
                schedule.releaseToScheduled(nextRunAt);
            } else {
                schedule.completeOneTime(executedAt);
            }
        } else {
            schedule.completeOneTime(executedAt);
        }
        callScheduleRepository.save(schedule);
    }

    /** 개인(care_target)이면 1건, 그룹(group)이면 care_target_group_map 기준 해당 그룹 소속 대상 전원의 target_phone 목록 */
    private List<String> collectTargetPhones(CallSchedule schedule) {
        List<String> list = new ArrayList<>();
        if (schedule.getCareTarget() != null) {
            String to = schedule.getCareTarget().getTargetPhone();
            if (to != null) {
                list.add(to);
            }
        } else if (schedule.getGroup() != null) {
            List<CareTargetGroupMap> maps = careTargetGroupMapRepository.findGroupDetails(
                    schedule.getOrganization().getOrganizationId(),
                    schedule.getGroup().getGroupId());
            for (CareTargetGroupMap map : maps) {
                if (map.getCareTarget() != null && map.getCareTarget().getTargetPhone() != null) {
                    list.add(map.getCareTarget().getTargetPhone());
                }
            }
        }
        return list;
    }

    // 반복 주기: 다음 실행 시각 계산
    // DAILY/WEEKLY/MONTHLY 기준 다음 실행 시각. recurrence_end_date 초과 시 null(반복 종료).
    private LocalDateTime calculateNextRunAt(LocalDateTime current, ScheduleRecurrence recurrence,
                                             LocalDateTime recurrenceEndDate) {
        LocalDateTime next = switch (recurrence) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusWeeks(1);
            case MONTHLY -> current.plusMonths(1);
        };
        if (recurrenceEndDate != null && next.isAfter(recurrenceEndDate)) {
            return null;
        }
        return next;
    }
}
