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
     * RAG를 활용하여 과거 기록과 현재 답변을 비교하며 자연스러운 질문 생성
     *
     * @param originalQuestion 원래 시나리오 질문
     * @param careTarget 어르신
     * @param previousAnswer 직전 답변 (null 가능, 첫 번째 질문인 경우)
     * @return 변형된 질문
     */
    public String generateContextualQuestion(String originalQuestion,
                                            CareTarget careTarget,
                                            String previousAnswer) {
        if (originalQuestion == null || originalQuestion.trim().isEmpty()) return originalQuestion;
        if (chatClient == null) return originalQuestion;

        String previousAnswerText = (previousAnswer != null && !previousAnswer.trim().isEmpty())
                ? previousAnswer : "없음 (첫 번째 질문)";

        // 1. Regex를 사용하여 현재 질문의 핵심 주제(약, 식사, 잠 등) 추출
        String currentSubject = extractSubject(originalQuestion);

        // 2. RAG 데이터 가져오기
        String contextText = contextService.buildContext(careTarget, previousAnswer, originalQuestion, 3);

        // 3. 긍정/부정 상태 파악 (환각 방지용)
        String sentimentGuide = "어르신의 답변에 맞춰 자연스럽게 반응하세요.";
        if (previousAnswerText.matches(".*(아니|못|아파|힘들어|안|나빠|그저|깜빡|안해).*")) {
            sentimentGuide = "주의: 어르신이 부정적인 상태를 언급했습니다. 절대 '다행이다'라고 하지 말고 걱정과 위로를 하세요.";
        }

        // 4. 프롬프트 구성 (주제 인지 강화)
        String prompt = String.format("""
                [역할] 어르신 안부를 확인하는 다정한 AI '케어파일럿'
                
                [대화 맥락]
                - **현재 질문 주제**: [%s]
                - **어르신의 방금 전 답변**: "%s"
                - **상태 가이드**: %s
                
                [미션: 멍청한 답변 방지]
                1. **답변 매칭**: 어르신의 답변 "%s"은 현재 주제인 [%s]에 대한 대답입니다. 
                   - 예: 주제가 '약'인데 "안 먹었어"라고 했다면, '식사'가 아니라 '약'을 안 드신 것입니다. 절대 딴소리(식사 등)를 하지 마세요.
                2. **과거 기록(RAG) 활용**: 아래 기록 중 [%s]와 관련된 내용만 인용하세요.
                   %s
                
                [작성 규칙]
                - 첫 문장은 반드시 어르신의 답변에 대한 적절한 리액션으로 시작하세요.
                - 말투는 70대 어르신과 대화하듯 부드러운 '해요체'를 사용하세요.
                - 마지막 문장은 반드시 원래 질문인 "%s"으로 끝내세요.
                
                [설명 없이 실제 말할 내용만 출력]
                """,
                currentSubject, previousAnswerText, sentimentGuide,
                previousAnswerText, currentSubject, currentSubject,
                contextText.isEmpty() ? "없음" : contextText,
                originalQuestion);

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

    /**
     * Regex 기반 주제 추출 메서드
     */
    private String extractSubject(String question) {
        if (question.matches(".*(약|복용|처방|물약|가루약|제때).*")) return "약 복용 여부";
        if (question.matches(".*(식사|밥|음식|먹었|진지|입맛).*")) return "식사 및 영양 상태";
        if (question.matches(".*(잠|수면|주무|밤새|꿈|설쳤).*")) return "수면 및 숙면 여부";
        if (question.matches(".*(어디|아픈|불편|통증|무릎|허리|머리|어지러).*")) return "신체 통증 및 불편함";
        if (question.matches(".*(컨디션|기분|어떠신가요|어떻게).*")) return "전반적인 건강 컨디션";
        return "일반 안부";
    }
}
