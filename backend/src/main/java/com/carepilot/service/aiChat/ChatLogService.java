package com.carepilot.service.aiChat;

import com.carepilot.domain.chat.ChatLog;
import com.carepilot.domain.user.User;
import com.carepilot.dto.aiChat.ChatLogResponseDTO;
import com.carepilot.repository.aiChat.ChatLogRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatLogService {

    private final UserRepository userRepository;
    private final ChatLogRepository chatLogRepository;

    //사용자 질문 등록------------------------------------------------
    @Transactional
    public Long insertUserMessage(Long userId, String userMessage){
        User user = userRepository.findById(userId).orElseThrow();

        ChatLog chatLog = ChatLog.builder()
                .user(user)
                .question(userMessage)
                .build();

        ChatLog chat = chatLogRepository.save(chatLog);

        return chat.getChatId();
    }
    //---------------------------------------------------------
    //ai응답 등록------------------------------------------------
    @Transactional
    public ChatLogResponseDTO insertAnswer(Long chatLogId, String answer) {
        ChatLog chat = chatLogRepository.findById(chatLogId).orElseThrow();
        chat.updateAnswer(answer);
        ChatLogResponseDTO cr = ChatLogResponseDTO.fromEntity(chat);
        return cr;
    }
    //전체조회--------------------------------------------------------------
    public List<ChatLogResponseDTO> loadAllChatLog(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        List<ChatLog> clAll = chatLogRepository.findByUser_UserIdAndCreatedAtAfterOrderByCreatedAtAsc(user.getUserId(), oneDayAgo);

        return clAll.stream()
                .map(ChatLogResponseDTO::fromEntity) // 각 ChatLog 객체를 DTO로 변환
                .collect(Collectors.toList());      // 리스트로 수집
    }


    }
