package com.carepilot.repository.notification;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.notification.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId ORDER BY n.occurredAt DESC")
    List<Notification> findByUserIdOrderByOccurredAtDesc(@Param("userId") Long userId);
    
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.status = :status ORDER BY n.occurredAt DESC")
    List<Notification> findByUserIdAndStatusOrderByOccurredAtDesc(@Param("userId") Long userId, @Param("status") NotificationStatus status);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.userId = :userId AND n.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") NotificationStatus status);
    
    @Query("SELECT n FROM Notification n WHERE n.call.callId = :callId AND n.type = :type")
    List<Notification> findByCallIdAndType(@Param("callId") Long callId, @Param("type") com.carepilot.domain.notification.NotificationType type);
    
    // 조직별 알림 조회 (개인 알림 + 조직 공유 알림) - JOIN FETCH로 프록시 문제 해결
    @Query("SELECT DISTINCT n FROM Notification n " +
           "LEFT JOIN FETCH n.organization " +
           "LEFT JOIN FETCH n.careTarget " +
           "LEFT JOIN FETCH n.call " +
           "LEFT JOIN FETCH n.user " +
           "WHERE n.organization.organizationId = :organizationId " +
           "AND (n.user.userId = :userId OR n.user IS NULL) " +
           "ORDER BY n.occurredAt DESC")
    List<Notification> findByOrganizationIdAndUserIdOrShared(
        @Param("organizationId") Long organizationId, 
        @Param("userId") Long userId
    );
    
    // 조직별 읽지 않은 알림 조회 - JOIN FETCH로 프록시 문제 해결
    @Query("SELECT DISTINCT n FROM Notification n " +
           "LEFT JOIN FETCH n.organization " +
           "LEFT JOIN FETCH n.careTarget " +
           "LEFT JOIN FETCH n.call " +
           "LEFT JOIN FETCH n.user " +
           "WHERE n.organization.organizationId = :organizationId " +
           "AND (n.user.userId = :userId OR n.user IS NULL) " +
           "AND n.status = :status " +
           "ORDER BY n.occurredAt DESC")
    List<Notification> findByOrganizationIdAndUserIdOrSharedAndStatus(
        @Param("organizationId") Long organizationId, 
        @Param("userId") Long userId,
        @Param("status") NotificationStatus status
    );
    
    // 조직별 읽지 않은 알림 개수
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.organization.organizationId = :organizationId " +
           "AND (n.user.userId = :userId OR n.user IS NULL) " +
           "AND n.status = :status")
    long countByOrganizationIdAndUserIdOrSharedAndStatus(
        @Param("organizationId") Long organizationId, 
        @Param("userId") Long userId,
        @Param("status") NotificationStatus status
    );
}

