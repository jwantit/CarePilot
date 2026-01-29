package com.carepilot.repository.task;

import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.task.AITask;
import com.carepilot.domain.task.AITaskStatus;
import com.carepilot.domain.task.AITaskType;
import com.carepilot.repository.organization.OrganizationRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@SpringBootTest
@Transactional
@Commit
@Log4j2
class AITaskRepositoryTests {

    @Autowired
    private AITaskRepository aiTaskRepository;
    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    void insertAITaskDummy() {
        Organization org = organizationRepository.findById(1L).orElseThrow();

        AITaskType[] types = { AITaskType.CALL_INIT, AITaskType.SCHEDULE_CHANGE, AITaskType.RISK_ALERT, AITaskType.AUTOMATION, AITaskType.OTHER };
        AITaskStatus[] statuses = { AITaskStatus.WAITING, AITaskStatus.SUCCESS, AITaskStatus.FAILED };

        for (int i = 0; i < types.length; i++) {
            LocalDateTime started = LocalDateTime.now().minusHours(i + 1);
            LocalDateTime completed = statuses[i % statuses.length] != AITaskStatus.WAITING ? LocalDateTime.now() : null;
            AITask aiTask = AITask.builder()
                    .organization(org)
                    .taskType(types[i])
                    .call(null)
                    .schedule(null)
                    .notification(null)
                    .task(null)
                    .careTarget(null)
                    .group(null)
                    .status(statuses[i % statuses.length])
                    .result("AI 처리 결과 더미 " + (i + 1))
                    .startedAt(started)
                    .completedAt(completed)
                    .build();
            aiTaskRepository.save(aiTask);
            log.info("AITask 더미 생성: aiTaskId={}, taskType={}", aiTask.getAiTaskId(), aiTask.getTaskType());
        }
    }
}