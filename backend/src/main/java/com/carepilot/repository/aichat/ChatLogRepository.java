package com.carepilot.repository.aichat;

import com.carepilot.domain.chat.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {

    List<ChatLog> findByUser_UserIdAndCreatedAtAfterOrderByCreatedAtAsc(Long userId, LocalDateTime after);

}
