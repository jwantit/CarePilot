package com.carepilot.service.call.scheduling;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

// 단일 서버용 주기 폴링: 실행 시각이 도래한 스케줄을 워커에 넘겨 선점·실행·DB 갱신.
// (추후 다중 서버 시 Claim 락 추가)
@Service
@RequiredArgsConstructor
@Log4j2
public class CallSchedulePollerService {

    private final CallScheduleWorkerService callScheduleWorkerService;

    // 주기 폴링 진입점
    // 5분마다 실행(테스트): 실행 시각이 된 스케줄 선점 → 발신 실행 → DB 상태 갱신
    @Scheduled(fixedDelay = 300_000)
    public void pollAndExecuteDueSchedules() {
        LocalDateTime now = LocalDateTime.now();
        List<Long> claimedIds = callScheduleWorkerService.claimDueSchedules(now);
        for (Long scheduleId : claimedIds) {
            callScheduleWorkerService.executeAndComplete(scheduleId, now);
        }
    }
}
