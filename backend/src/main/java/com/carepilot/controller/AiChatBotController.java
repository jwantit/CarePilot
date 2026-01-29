package com.carepilot.controller;

import com.carepilot.dto.aiChat.AiChatRequest;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.security.util.UserUtil;
import com.carepilot.service.aiChat.VectorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
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
    private final VectorService vectorService;
    private final ChatClient ollama;
    private final ChatClient openai;

    public AiChatBotController(
            UserUtil userUtil,
            VectorService vectorService,
            @Qualifier("ollamaChatClient") ChatClient ollama,
            @Qualifier("openaiChatClient") ChatClient openai
    ) {
        this.userUtil = userUtil;
        this.vectorService = vectorService;
        this.ollama = ollama;
        this.openai = openai;
    }

    /**
     * [복구된 테스트용 데이터 저장 API]
     * 브라우저 실행: http://localhost:8080/api/ai/test/save
     */
    @GetMapping("/test/save")
    public String testSave() {
        // 테스트용 가상 데이터 저장 (VectorService를 통해 Redis로 전송)
        vectorService.savePatientToVectorDb("P_001", "홍길동", "HANSIM_01",
                "홍길동 환자는 고혈압이 있으며 매일 오전 9시에 약을 복용해야 합니다.");

        vectorService.savePatientToVectorDb("P_002", "이영희", "SEOUL_02",
                "김영남 환자는 최근 무릎 수술을 받아 거동이 불편하므로 보행 보조가 필요합니다.");

        return "✅ 테스트 데이터가 Redis Vector Store(carepilot:)에 저장되었습니다!";
    }

    /**
     * [RAG 기반] AI 채팅 API
     */
    @PostMapping("/chat")
    public String chat(@RequestBody AiChatRequest request) {
        UserDTO userDTO = userUtil.getCurrentUserDTO();
        String userMessage = request.getMessage();

        // 1. Redis에서 관련 지식 검색 (최대 10개)
        List<Document> relevantDocs = vectorService.searchRelevantData(userMessage);


        log.info(relevantDocs.toString());

        // 2. 검색된 문서들을 하나의 텍스트(Context)로 합치기 (중요!)
        String context = relevantDocs.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n"));
        log.info("검색모델" + context);

        // 3. AI 호출
        return ollama.prompt()
                .system(s -> s.text("너는 전문적인 케어 파일럿 비서야. " +
                                "반드시 아래 제공된 [참고 정보]만을 근거로 답변해줘. " +
                                "정보에 없는 내용은 추측하지 말고 모른다고 답변해.\n\n" +
                                "[참고 정보]\n{context}")
                        .param("context", context))
                .user(userMessage)
                .call()
                .content();
    }
}