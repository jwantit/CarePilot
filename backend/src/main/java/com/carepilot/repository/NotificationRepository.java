package com.carepilot.repository;

import com.carepilot.domain.notification.Notification;
import com.carepilot.domain.enums.NotificationStatus;
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
}

