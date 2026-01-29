package com.carepilot.repository.task;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.enums.Priority;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.task.Task;
import com.carepilot.domain.task.TaskStatus;
import com.carepilot.domain.task.TaskType;
import com.carepilot.domain.user.User;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
@Transactional
@Commit  // 실제 DB에 저장하려면 사용. 롤백만 원하면 제거
@Log4j2
class TaskRepositoryTests {

    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CareTargetRepository careTargetRepository;

    @Test
    void insertTaskDummy() {
        Organization org = organizationRepository.findById(1L).orElseThrow();
        List<User> users = userRepository.findByOrganization(org);
        List<CareTarget> targets = careTargetRepository.findByOrganizationIdAndFilterAndKeyword(
                org.getOrganizationId(),  null);
        User creator = users.isEmpty() ? null : users.get(0);
        User assignee = users.size() > 1 ? users.get(1) : null;
        CareTarget target = targets.isEmpty() ? null : targets.get(0);

        String[] titles = { "혈당 수치 재확인", "긴급 알림 처리", "약물 복용 일정 확인", "후속 방문 연락" };
        TaskType[] types = { TaskType.RISK_FOLLOWUP, TaskType.NORMAL, TaskType.CARE, TaskType.OTHER };
        Priority[] priorities = { Priority.HIGH, Priority.URGENT, Priority.MEDIUM, Priority.LOW };
        TaskStatus[] statuses = { TaskStatus.WAITING, TaskStatus.PROGRESS, TaskStatus.DONE };

        for (int i = 0; i < titles.length; i++) {
            Task task = Task.builder()
                    .organization(org)
                    .careTarget(target)
                    .title(titles[i])
                    .description("더미 설명 " + (i + 1))
                    .type(types[i])
                    .priority(priorities[i])
                    .status(statuses[i % statuses.length])
                    .createdBy(creator)
                    .assignedTo(i % 2 == 0 ? assignee : null)
                    .dueDate(LocalDateTime.now().plusDays(i + 1))
                    .completedAt(statuses[i % statuses.length] == TaskStatus.DONE ? LocalDateTime.now() : null)
                    .build();
            taskRepository.save(task);
            log.info("Task 더미 생성: taskId={}, title={}", task.getTaskId(), task.getTitle());
        }
    }
}