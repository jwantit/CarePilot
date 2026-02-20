package com.carepilot.service.aiChat;

import lombok.extern.slf4j.Slf4j;
// 올바른 임포트로 수정
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;


import java.util.List;


@Slf4j
@Service
public class VectorService {

    private final VectorStore vectorStore;

    public VectorService(
            @Qualifier("ChatBotVectorStore") VectorStore vectorStore
    ) {
        this.vectorStore = vectorStore;
    }

    public List<Document> searchRelevantData(String query, Long organizationId) {
        FilterExpressionBuilder b = new FilterExpressionBuilder();
        // organizationId가 정확히 일치하는지 확인
        Filter.Expression filter = b.eq("organizationId", organizationId).build();

        SearchRequest searchRequest = SearchRequest.builder()
                .query(query)
                .topK(2) // 40개는 너무 많습니다. 핵심 정보 5개면 충분합니다.
                .similarityThreshold(0.6) // 최소한의 유사성이 있는 것만 가져옵니다.
                .filterExpression(filter)
                .build();

        return vectorStore.similaritySearch(searchRequest);
    }
}