package com.carepilot.repository;

import com.carepilot.domain.notification.NotificationStatus;
import com.carepilot.domain.notification.NotificationType;
import com.carepilot.domain.notification.RiskLevel;
import com.carepilot.domain.user.UserRole;
import com.carepilot.domain.user.UserStatus;
import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.repository.notification.NotificationRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.user.UserRepository;
import com.carepilot.service.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 알림 관련 더미 데이터 생성 테스트
 * 
 * 사용 방법:
 * 1. insertUser() - User와 Organization 생성
 * 2. insertNotification() - 알림 생성 (직접 Repository 사용)
 * 3. insertNotificationSimple() - 알림 생성 (NotificationService 사용)
 * 
 * @Commit 어노테이션으로 실제 DB에 저장됩니다.
 */
@SpringBootTest
@Transactional
@Commit
class NotificationTests {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    /**
     * User 더미 데이터 생성 테스트
     *
     * 사용 방법:
     * 1. 이 테스트를 실행하면 DB에 User와 Organization이 생성됩니다.
     * 2. @Commit 어노테이션으로 실제 DB에 저장됩니다.
     */
    @Test
    void insertUser() {
        System.out.println("=== User 더미 데이터 생성 시작 ===");

        // 1. Organization 생성 또는 조회
        Organization organization = organizationRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    try {
                        // Organization은 Builder가 없으므로 리플렉션을 사용하여 생성
                        Constructor<Organization> constructor = Organization.class.getDeclaredConstructor();
                        constructor.setAccessible(true);
                        Organization org = constructor.newInstance();

                        // 리플렉션을 사용하여 필드 설정
                        Field nameField = Organization.class.getDeclaredField("name");
                        nameField.setAccessible(true);
                        nameField.set(org, "테스트 기관");

                        Field orgNumberField = Organization.class.getDeclaredField("organizationNumber");
                        orgNumberField.setAccessible(true);
                        orgNumberField.set(org, "ORG-001");

                        Organization saved = organizationRepository.save(org);
                        System.out.println("Organization 생성 완료 - ID: " + saved.getOrganizationId());
                        return saved;
                    } catch (Exception e) {
                        throw new RuntimeException("Organization 생성 실패: " + e.getMessage(), e);
                    }
                });

        System.out.println("Organization ID: " + organization.getOrganizationId());

        // 2. User 생성 (이미 있으면 스킵)
        List<User> existingUsers = userRepository.findAll();
        if (!existingUsers.isEmpty()) {
            System.out.println("이미 User가 존재합니다. 기존 User 개수: " + existingUsers.size());
            existingUsers.forEach(user -> {
                System.out.println(String.format(
                        "- User ID: %d, Email: %s, Name: %s",
                        user.getUserId(),
                        user.getEmail(),
                        user.getName()
                ));
            });
            return;
        }

        // 3. 여러 User 생성
        User admin = User.builder()
                .email("admin@example.com")
                .password("password123")
                .name("관리자")
                .phone("010-1111-1111")
                .role(UserRole.ADMIN)
                .organization(organization)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);
        System.out.println("Admin User 생성 완료 - ID: " + admin.getUserId());

        User manager = User.builder()
                .email("manager@example.com")
                .password("password123")
                .name("매니저")
                .phone("010-2222-2222")
                .role(UserRole.MANAGER)
                .organization(organization)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(manager);
        System.out.println("Manager User 생성 완료 - ID: " + manager.getUserId());

        User user = User.builder()
                .email("user@example.com")
                .password("password123")
                .name("일반 사용자")
                .phone("010-3333-3333")
                .role(UserRole.USER)
                .organization(organization)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(user);
        System.out.println("User 생성 완료 - ID: " + user.getUserId());

        System.out.println("\n=== User 더미 데이터 생성 완료 ===");
        System.out.println("생성된 User 개수: " + userRepository.count());
        System.out.println("\n생성된 User 목록:");
        userRepository.findAll().forEach(u -> {
            System.out.println(String.format(
                    "- ID: %d, Email: %s, Name: %s, Role: %s",
                    u.getUserId(),
                    u.getEmail(),
                    u.getName(),
                    u.getRole()
            ));
        });
    }

    /**
     * 알림 더미 데이터 생성 테스트 (직접 Repository 사용)
     * 
     * 사용 방법:
     * 1. 이 테스트를 실행하면 DB에 더미 데이터가 생성됩니다.
     * 2. @Commit 어노테이션으로 실제 DB에 저장됩니다.
     * 3. User와 Organization이 없으면 자동으로 생성합니다.
     */
    @Test
    void insertNotification() {
        System.out.println("=== 알림 더미 데이터 생성 시작 ===");

        // 1. Organization 생성 또는 조회
        Organization organization = organizationRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    // Organization은 Builder가 없으므로 리플렉션을 사용하여 생성
                    try {
                        Constructor<Organization> constructor = Organization.class.getDeclaredConstructor();
                        constructor.setAccessible(true);
                        Organization org = constructor.newInstance();
                        
                        // 리플렉션을 사용하여 필드 설정
                        java.lang.reflect.Field nameField = Organization.class.getDeclaredField("name");
                        nameField.setAccessible(true);
                        nameField.set(org, "테스트 기관");
                        
                        java.lang.reflect.Field orgNumberField = Organization.class.getDeclaredField("organizationNumber");
                        orgNumberField.setAccessible(true);
                        orgNumberField.set(org, "ORG-001");
                        
                        return organizationRepository.save(org);
                    } catch (Exception e) {
                        throw new RuntimeException("Organization 생성 실패: " + e.getMessage(), e);
                    }
                });

        System.out.println("Organization ID: " + organization.getOrganizationId());

        // 2. User 생성 또는 조회
        User user = userRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email("test@example.com")
                            .password("password123")
                            .name("테스트 사용자")
                            .phone("010-1234-5678")
                            .role(UserRole.ADMIN)
                            .organization(organization)
                            .status(UserStatus.ACTIVE)
                            .build();
                    return userRepository.save(newUser);
                });

        System.out.println("User ID: " + user.getUserId());

        // 3. 다양한 타입의 알림 생성
        List<Notification> notifications = new ArrayList<>();

        // 생체신호 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.VITAL_SIGN,
                "혈압 이상 감지",
                "환자의 혈압이 정상 범위를 벗어났습니다. (150/95 mmHg)",
                RiskLevel.MEDIUM
        ));

        // 긴급 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.EMERGENCY,
                "긴급 상황 발생",
                "환자에게 긴급한 의료 조치가 필요합니다.",
                RiskLevel.CRITICAL
        ));

        // 약물 관련 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.MEDICATION,
                "약물 복용 시간 알림",
                "오후 2시 약물 복용 시간입니다.",
                RiskLevel.LOW
        ));

        // 통화 관련 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.CALL,
                "통화 일정 알림",
                "내일 오전 10시 통화 일정이 있습니다.",
                RiskLevel.LOW
        ));

        // 위험 감지 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.RISK_DETECTION,
                "이상 행동 패턴 감지",
                "AI가 환자의 이상 행동 패턴을 감지했습니다.",
                RiskLevel.HIGH
        ));

        // 스케줄 관련 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.SCHEDULE,
                "케어 일정 알림",
                "오늘 오후 3시 케어 방문 일정이 있습니다.",
                RiskLevel.LOW
        ));

        // 기타 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.OTHER,
                "시스템 업데이트 알림",
                "시스템이 업데이트되었습니다.",
                null
        ));

        // 읽지 않은 알림 (ACTIVE 상태)
        notifications.add(createNotification(
                organization, user,
                NotificationType.VITAL_SIGN,
                "심박수 이상",
                "환자의 심박수가 비정상적으로 높습니다. (120 bpm)",
                RiskLevel.HIGH,
                NotificationStatus.ACTIVE
        ));

        // 처리 중인 알림
        notifications.add(createNotification(
                organization, user,
                NotificationType.RISK_DETECTION,
                "낙상 위험 감지",
                "환자의 낙상 위험이 감지되었습니다.",
                RiskLevel.CRITICAL,
                NotificationStatus.PROCESSING
        ));

        // 해결된 알림
        Notification resolvedNotification = createNotification(
                organization, user,
                NotificationType.EMERGENCY,
                "긴급 상황 해결됨",
                "긴급 상황이 해결되었습니다.",
                RiskLevel.MEDIUM,
                NotificationStatus.RESOLVED
        );
        resolvedNotification.markAsRead(user);
        notifications.add(resolvedNotification);

        // 4. DB에 저장
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);

        System.out.println("=== 알림 더미 데이터 생성 완료 ===");
        System.out.println("생성된 알림 개수: " + savedNotifications.size());
        savedNotifications.forEach(n -> {
            System.out.println(String.format(
                    "- 알림 ID: %d, 타입: %s, 제목: %s, 상태: %s",
                    n.getNotificationId(),
                    n.getType(),
                    n.getTitle(),
                    n.getStatus()
            ));
        });
    }

    /**
     * 간단한 알림 더미 데이터 생성 테스트 (NotificationService 사용)
     * 
     * NotificationService를 사용하여 알림을 생성합니다.
     * User ID가 1인 사용자에게 알림을 생성합니다.
     * 
     * 사용 방법:
     * 1. 먼저 User가 DB에 존재해야 합니다.
     * 2. 이 테스트를 실행하면 DB에 더미 데이터가 생성됩니다.
     */
    @Test
    void insertNotificationSimple() {
        System.out.println("=== 간단한 알림 더미 데이터 생성 시작 ===");

        // User ID 확인 (기존 User가 있는지 확인)
        Long userId = userRepository.findAll().stream()
                .findFirst()
                .map(user -> {
                    System.out.println("사용할 User ID: " + user.getUserId() + " (Email: " + user.getEmail() + ")");
                    return user.getUserId();
                })
                .orElseThrow(() -> new RuntimeException(
                        "DB에 User가 없습니다. 먼저 insertUser() 테스트를 실행하여 User를 생성해주세요.\n" +
                        "또는 insertNotification() 테스트를 실행하면 User와 Organization이 자동으로 생성됩니다."
                ));

        // 다양한 타입의 알림 생성
        System.out.println("\n1. 생체신호 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.VITAL_SIGN,
                "혈압 이상 감지",
                "환자의 혈압이 정상 범위를 벗어났습니다.",
                RiskLevel.MEDIUM
        );

        System.out.println("2. 긴급 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.EMERGENCY,
                "긴급 상황 발생",
                "환자에게 긴급한 의료 조치가 필요합니다.",
                RiskLevel.CRITICAL
        );

        System.out.println("3. 약물 관련 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.MEDICATION,
                "약물 복용 시간 알림",
                "오후 2시 약물 복용 시간입니다.",
                RiskLevel.LOW
        );

        System.out.println("4. 통화 관련 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.CALL,
                "통화 일정 알림",
                "내일 오전 10시 통화 일정이 있습니다.",
                RiskLevel.LOW
        );

        System.out.println("5. 위험 감지 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.RISK_DETECTION,
                "이상 행동 패턴 감지",
                "AI가 환자의 이상 행동 패턴을 감지했습니다.",
                RiskLevel.HIGH
        );

        System.out.println("6. 스케줄 관련 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.SCHEDULE,
                "케어 일정 알림",
                "오늘 오후 3시 케어 방문 일정이 있습니다.",
                RiskLevel.LOW
        );

        System.out.println("7. 기타 알림 생성");
        notificationService.createAndSendNotification(
                userId,
                NotificationType.OTHER,
                "시스템 업데이트 알림",
                "시스템이 업데이트되었습니다.",
                null
        );

        // 생성된 알림 개수 확인
        long count = notificationRepository.count();
        System.out.println("\n=== 알림 더미 데이터 생성 완료 ===");
        System.out.println("총 알림 개수: " + count);
    }

    /**
     * 알림 생성 헬퍼 메서드 (ACTIVE 상태)
     */
    private Notification createNotification(
            Organization organization,
            User user,
            NotificationType type,
            String title,
            String description,
            RiskLevel severity) {
        return createNotification(organization, user, type, title, description, severity, NotificationStatus.ACTIVE);
    }

    /**
     * 알림 생성 헬퍼 메서드 (상태 지정 가능)
     */
    private Notification createNotification(
            Organization organization,
            User user,
            NotificationType type,
            String title,
            String description,
            RiskLevel severity,
            NotificationStatus status) {
        return Notification.builder()
                .organization(organization)
                .user(user)
                .type(type)
                .title(title)
                .description(description)
                .severity(severity)
                .status(status)
                .occurredAt(LocalDateTime.now().minusHours((long) (Math.random() * 24)))
                .build();
    }
}

