package com.carepilot.controller;

import com.carepilot.dto.aiChat.AiChatRequest;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.aiChat.CarePilotPromptProviderService;
import com.carepilot.service.aiChat.CarePilotToolsService;
import com.carepilot.service.aiChat.VectorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiChatBotController {

    private final UserUtil userUtil;
    private final ChatClient chatgpt;
    private final ChatMemory chatMemory;
    private final VectorStore vectorStore; //백터 임베딩
    private final CarePilotToolsService carePilotToolsService; // 실제 행동을 수행할 도구
    private final CarePilotPromptProviderService carePilotPromptProviderService;
    private final VectorService vectorService;

    public AiChatBotController(
            UserUtil userUtil,
            @Qualifier("openaiChatClient") ChatClient chatgpt,
            ChatMemory chatMemory,
            @Qualifier("ChatBotVectorStore") VectorStore chatBotVectorStore,
            CarePilotToolsService carePilotToolsService,
            CarePilotPromptProviderService carePilotPromptProviderService, // 주입
            VectorService vectorService
    ) {
        this.userUtil = userUtil;
        this.chatgpt = chatgpt;
        this.chatMemory = chatMemory;
        this.vectorStore = chatBotVectorStore;
        this.carePilotToolsService = carePilotToolsService;
        this.carePilotPromptProviderService = carePilotPromptProviderService;
        this.vectorService = vectorService;
    }

    @PostMapping("/chat")
    public String chat(@RequestBody AiChatRequest request) {
        UserDTO userDTO = userUtil.getCurrentUserDTO();
        String userMessage = request.getMessage();
        String userIdMemory = userDTO.getUserId().toString();
        Long userId = userDTO.getUserId();
        String userName = userDTO.getName();


        log.info("유저({}) 질문: {}", userIdMemory, userMessage);

        List<Message> lastMessages = chatMemory.get(userIdMemory, 10);

        String historyText = lastMessages.stream()
                .map(Message::getText)
                // [필터링 조건 추가]
                .filter(text -> text != null && text.trim().length() > 2) // 너무 짧은 메시지(1, 응, 네) 제외
                .filter(text -> !text.matches("^[0-9]+(번|위)?$"))        // 숫자만 있거나 '1번' 같은 형식 제외
                .collect(Collectors.joining(" "));

        String searchQuery = String.format("상황: %s, 질문: %s", historyText, userMessage);

        List<Document> searchResults =
                vectorService.searchRelevantData(searchQuery, userDTO.getOrganizationId());

        // 2. 검색된 데이터를 하나의 문자열로 합치기
        StringBuilder contextBuilder = new StringBuilder();
        if (searchResults.isEmpty()) {
            log.warn("검색된 데이터가 없습니다!");
            contextBuilder.append("관련된 환자 정보를 찾을 수 없습니다.");
        } else {
            for (Document doc : searchResults) {
                contextBuilder.append(doc.getFormattedContent()).append("\n");
            }
        }

        String dynamicPrompt = carePilotPromptProviderService.getDynamicPrompt(historyText, userDTO.getOrganizationId(), userName);

        log.info("=== [최종 주입될 프롬프트 확인] ===\n{}", dynamicPrompt);
        String finalSystemPrompt = dynamicPrompt.replace("{question_answer_context}", contextBuilder);

        // 4. ChatClient 실행 (QuestionAnswerAdvisor 제거)
        return chatgpt.prompt()
                .advisors(
                        // [기능 1] 단기 기억 유지
                        new MessageChatMemoryAdvisor(chatMemory, userIdMemory, 10)
                )
                .tools(carePilotToolsService) // [기능 3] 수정/예약 툴 연결
                .system(finalSystemPrompt)
                .user(userMessage)
                .call()
                .content();
    }
}