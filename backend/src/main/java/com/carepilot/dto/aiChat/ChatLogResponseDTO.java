package com.carepilot.dto.aiChat;

import com.carepilot.domain.chat.ChatLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatLogResponseDTO {
    private Long chatId;
    private String question;
    private String answer;

    // 프론트엔드에서 "오전 10:30" 또는 "2024-05-20" 처럼 보여주기 위해 포맷팅된 시간
    private String createdAt;

    // 엔티티를 DTO로 변환하는 정적 메서드 (Service에서 사용)
    public static ChatLogResponseDTO fromEntity(ChatLog entity) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH시 mm분");
        String formattedDate = (entity.getCreatedAt() != null)
                ? entity.getCreatedAt().format(formatter)
                : "방금 전";
        return ChatLogResponseDTO.builder()
                .chatId(entity.getChatId())
                .question(entity.getQuestion())
                .answer(entity.getAnswer())
                .createdAt(formattedDate)
                .build();
    }
}