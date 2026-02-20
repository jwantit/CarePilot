package com.carepilot.service.call.context;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.service.call.vector.VectorSearchResult;
import com.carepilot.service.call.vector.CallVectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Log4j2
public class ConversationContextService {

    private final CallVectorStoreService callVectorStoreService;

    /**
     * 과거 기록을 검색하여 컨텍스트 조립
     * 현재 답변과 다음 질문을 모두 사용하여 다중 검색 수행
     * 
     * @param careTarget 어르신
     * @param currentAnswer 현재 답변 (null 가능)
     * @param nextQuestion 다음 질문 (null 가능)
     * @param topK 검색할 과거 기록 개수
     * @return 컨텍스트 문자열
     */
    public String buildContext(CareTarget careTarget, String currentAnswer, String nextQuestion, int topK) {
        if (careTarget == null) {
            log.warn("CareTarget이 null이어서 컨텍스트 검색 스킵");
            return "";
        }

        List<VectorSearchResult> contextByAnswer = List.of();
        List<VectorSearchResult> contextByQuestion = List.of();

        // 1. 현재 답변 기반 검색 (어르신의 현재 상태와 비슷한 과거 상황 찾기)
        if (currentAnswer != null && !currentAnswer.trim().isEmpty()) {
            contextByAnswer = callVectorStoreService.searchSimilarAnswers(
                    careTarget.getCareTargetId(), currentAnswer, topK);
            log.debug("현재 답변 기반 검색 결과: careTargetId={}, 결과 개수={}", 
                    careTarget.getCareTargetId(), contextByAnswer.size());
        }

        // 2. 다음 질문 기반 검색 (다음에 물어볼 주제에 대한 과거 기록 찾기)
        if (nextQuestion != null && !nextQuestion.trim().isEmpty()) {
            contextByQuestion = callVectorStoreService.searchSimilarAnswers(
                    careTarget.getCareTargetId(), nextQuestion, topK);
            log.debug("다음 질문 기반 검색 결과: careTargetId={}, 결과 개수={}", 
                    careTarget.getCareTargetId(), contextByQuestion.size());
        }

        // 3. 중복 제거 및 통합 (LinkedHashSet으로 순서 유지 및 중복 제거)
        Set<VectorSearchResult> combinedResults = new LinkedHashSet<>(contextByAnswer);
        combinedResults.addAll(contextByQuestion);

        if (combinedResults.isEmpty()) {
            log.debug("유사한 과거 기록 없음: careTargetId={}", careTarget.getCareTargetId());
            return "";
        }

        // 4. 문자열 조립
        StringBuilder context = new StringBuilder("\n[어르신 관련 과거 기록]\n");
        combinedResults.stream().limit(5).forEach(result -> {
            if (result.getAnswer() != null) {
                String timestamp = result.getTimestamp() != null && result.getTimestamp().length() >= 10
                        ? result.getTimestamp().substring(0, 10)
                        : (result.getTimestamp() != null ? result.getTimestamp() : "날짜 없음");
                String question = result.getQuestion() != null && !result.getQuestion().isEmpty()
                        ? result.getQuestion()
                        : "질문 없음";
                context.append(String.format("- %s: %s (질문: %s)\n",
                        timestamp,
                        result.getAnswer(),
                        question));
            }
        });

        String contextStr = context.toString();
        log.debug("컨텍스트 조립 완료: careTargetId={}, 기록 개수={}", 
                careTarget.getCareTargetId(), combinedResults.size());
        return contextStr;
    }
}


