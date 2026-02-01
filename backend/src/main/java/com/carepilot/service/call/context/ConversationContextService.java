package com.carepilot.service.call.context;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.service.call.vector.VectorSearchResult;
import com.carepilot.service.call.vector.CallVectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class ConversationContextService {
    
    private final CallVectorStoreService callVectorStoreService;
    
    /**
     * 과거 기록을 검색하여 컨텍스트 조립
     * @param careTarget 어르신
     * @param currentAnswer 현재 답변
     * @param topK 검색할 과거 기록 개수
     * @return 컨텍스트 문자열
     */
    public String buildContext(CareTarget careTarget, String currentAnswer, int topK) {
        if (careTarget == null) {
            log.warn("CareTarget이 null이어서 컨텍스트 검색 스킵");
            return "";
        }
        
        if (currentAnswer == null || currentAnswer.trim().isEmpty()) {
            log.debug("현재 답변이 비어있어서 컨텍스트 검색 스킵");
            return "";
        }
        
        // KNN 검색으로 유사한 과거 기록 찾기 (VectorStore가 자동으로 임베딩 생성)
        List<VectorSearchResult> similarAnswers = callVectorStoreService.searchSimilarAnswers(
            careTarget.getCareTargetId(), currentAnswer, topK);
        
        if (similarAnswers.isEmpty()) {
            log.debug("유사한 과거 기록 없음: careTargetId={}", careTarget.getCareTargetId());
            return "";
        }
        
        // 컨텍스트 문자열 조립
        StringBuilder context = new StringBuilder();
        context.append("과거 기록:\n");
        for (VectorSearchResult result : similarAnswers) {
            if (result.getTimestamp() != null && result.getAnswer() != null) {
                String timestamp = result.getTimestamp();
                // 날짜 형식 간소화 (필요시)
                if (timestamp.length() > 10) {
                    timestamp = timestamp.substring(0, 10);
                }
                context.append(String.format("- %s: %s", timestamp, result.getAnswer()));
                if (result.getQuestion() != null && !result.getQuestion().isEmpty()) {
                    context.append(String.format(" (질문: %s)", result.getQuestion()));
                }
                context.append("\n");
            }
        }
        
        String contextStr = context.toString();
        log.debug("컨텍스트 조립 완료: careTargetId={}, 기록 개수={}", 
            careTarget.getCareTargetId(), similarAnswers.size());
        return contextStr;
    }
}

