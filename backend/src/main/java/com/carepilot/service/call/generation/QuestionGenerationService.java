package com.carepilot.service.call.generation;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.service.call.context.ConversationContextService;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class QuestionGenerationService {
    
    private final ChatClient chatClient;
    private final ConversationContextService contextService;
    
    public QuestionGenerationService(
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient,
            ConversationContextService contextService) {
        this.chatClient = chatClient;
        this.contextService = contextService;
    }
    
    /**
     * 과거 기록을 참고하여 질문을 변형
     * @param originalQuestion 원래 시나리오 질문
     * @param careTarget 어르신
     * @param previousAnswer 직전 답변 (있으면)
     * @return 변형된 질문
     */
    public String generateContextualQuestion(String originalQuestion, 
                                            CareTarget careTarget,
                                            String previousAnswer) {
        if (originalQuestion == null || originalQuestion.trim().isEmpty()) {
            log.warn("원래 질문이 비어있어서 변형 스킵");
            return originalQuestion;
        }
        
        if (chatClient == null) {
            log.warn("ChatClient not configured, returning original question");
            return originalQuestion;
        }
        
        // 과거 기록 검색
        String context = contextService.buildContext(careTarget, 
            previousAnswer != null ? previousAnswer : "", 3);
        
        String previousAnswerText = previousAnswer != null && !previousAnswer.trim().isEmpty() 
            ? previousAnswer 
            : "없음 (첫 번째 질문)";
        
        String contextText = context.isEmpty() ? "없음" : context;
        
        String prompt = String.format("""
            [역할]
            당신은 혼자 계신 어르신의 건강을 챙기는 다정하고 똑똑한 안부 확인 서비스 '케어파일럿'입니다.
            
            [입력 데이터]
            1. 원래 해야 할 질문: "%s"
            2. 어르신의 직전 답변: "%s"
            3. 어르신의 과거 기록(RAG): %s
            
            [작성 규칙]
            1. **공감적 리액션**: 어르신의 [직전 답변]에 대해 짤막하게(1문장 내외) 따뜻한 반응을 보이세요.
               - 절대 답변 내용을 그대로 반복하지 마세요. (예: "머리 아파" -> "머리 아프시군요" (X) / "아이구, 통증 때문에 고생이 많으시네요" (O))
            
            2. **맥락 연결(RAG 활용)**: [과거 기록]에 오늘 질문과 관련된 아픈 부위나 상황이 있다면 슬쩍 언급하며 물으세요. 
               - 단, 반드시 [원래 해야 할 질문]의 주제 안에서만 언급하세요.
               - 예: 원래 질문이 "식사는 하셨나요?"이고 과거 기록에 "두통"이 있어도, 두통을 언급하지 마세요. 식사와 관련된 기록만 활용하세요.
               - 관련 기록이 없다면 억지로 끼워 넣지 말고 자연스럽게 넘어갑니다.
            
            3. **핵심 질문 유지 (절대 규칙)**: 
               - 리액션 후에는 반드시 [원래 해야 할 질문]을 그대로 물어야 합니다.
               - 원래 질문이 "식사는 하셨나요?"이면 → 반드시 "식사는 하셨나요?"로 끝나야 합니다.
               - 원래 질문이 "약은 드셨나요?"이면 → 반드시 "약은 드셨나요?"로 끝나야 합니다.
               - 절대로 다른 주제(약, 컨디션, 식사 등)로 바꾸지 마세요.
            
            4. **질문은 하나만**: 한 번에 하나의 질문만 하세요. 여러 질문을 묶어서 하지 마세요.
            
            5. **말투**: 70-80대 어르신과 대화하듯 부드럽고, 다정하며, 예의 바른 '해요체'를 사용하세요.
            
            [출력 가이드]
            - 불필요한 연결어(그나저나, 그럼 등)를 줄이고 한 문장 혹은 두 문장의 자연스러운 흐름으로 만드세요.
            - 설명이나 주석 없이 '실제 말할 내용'만 출력하세요.
            - 반드시 [원래 해야 할 질문]의 주제로 끝나야 합니다.
            
            [출력 예시]
            - 입력: (질문: 식사는 하셨나요? / 답변: 입맛이 없어 / 기록: 어제 두통)
            - 출력: "입맛이 없으시다니 기운이 없으실까 봐 걱정되네요. 식사는 하셨나요?"
            
            - 입력: (질문: 약 드셨나요? / 답변: 입맛이 없어 / 기록: 어제 두통)
            - 출력: "입맛이 없으시다니 기운이 없으실까 봐 걱정되네요. 어제 두통은 좀 가라앉으셨는지, 오늘 약은 드셨나요?"
            
            - 입력: (질문: 컨디션은 어떠신가요? / 답변: 네 먹었습니다 / 기록: 어제 두통)
            - 출력: "저번에 아프셨던 두통은 좀 나아지셨나요? 오늘 컨디션은 어떠신가요?"
            """,
            originalQuestion,
            previousAnswerText,
            contextText);
        
        try {
            String generatedQuestion = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
            
            if (generatedQuestion != null && !generatedQuestion.trim().isEmpty()) {
                String trimmed = generatedQuestion.trim();
                log.debug("질문 변형 성공: original={}, generated={}", originalQuestion, trimmed);
                return trimmed;
            }
            
            // 생성 실패 시 원래 질문 반환
            log.warn("질문 생성 결과가 비어있어서 원래 질문 반환");
            return originalQuestion;
        } catch (Exception e) {
            log.error("질문 생성 실패: originalQuestion={}, error={}", originalQuestion, e.getMessage(), e);
            return originalQuestion;
        }
    }
}
