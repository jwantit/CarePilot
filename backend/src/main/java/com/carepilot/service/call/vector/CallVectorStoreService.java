package com.carepilot.service.call.vector;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Log4j2
public class CallVectorStoreService {
    
    @Qualifier("callLogVectorStore")
    private final VectorStore vectorStore;

    // @RequiredArgsConstructor 제거하고 수동 생성자 작성
    public CallVectorStoreService(@Qualifier("callLogVectorStore") VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }
    
    /**
     * 답변을 벡터로 변환하여 Redis에 저장
     * @param careTargetId 어르신 ID
     * @param questionText 질문 내용
     * @param answerText 답변 내용
     * @param embedding 벡터 (1024차원) - 사용하지 않음 (VectorStore가 자동으로 생성)
     * @param callDateTime 통화 일시
     */
    public void saveAnswerVector(Long careTargetId, String questionText, 
                                 String answerText, float[] embedding, 
                                 LocalDateTime callDateTime) {
        if (answerText == null || answerText.trim().isEmpty()) {
            log.warn("빈 답변으로 저장 시도: careTargetId={}", careTargetId);
            return;
        }
        
        try {
            // Document 생성 (텍스트와 메타데이터 포함)
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("careTargetId", careTargetId.toString());
            metadata.put("question", questionText != null ? questionText : "");
            metadata.put("answer", answerText);
            metadata.put("timestamp", callDateTime != null ? callDateTime.toString() : LocalDateTime.now().toString());
            
            // Document ID는 careTargetId와 timestamp를 조합하여 생성
            String documentId = String.format("care_target_%d_%s", 
                careTargetId, UUID.randomUUID().toString());
            
            // 답변 텍스트를 Document로 저장 (VectorStore가 자동으로 임베딩 생성)
            Document document = new Document(documentId, answerText, metadata);
            vectorStore.add(List.of(document));
            
            log.info("벡터 저장 완료: careTargetId={}, documentId={}, answer={}", 
                careTargetId, documentId, answerText);
        } catch (Exception e) {
            log.error("벡터 저장 실패: careTargetId={}, error={}", careTargetId, e.getMessage(), e);
        }
    }
    
    /**
     * KNN 검색으로 유사한 과거 답변 찾기
     * @param careTargetId 어르신 ID
     * @param queryText 검색 쿼리 텍스트 (임베딩은 VectorStore가 자동 생성)
     * @param topK 상위 K개 결과
     * @return 유사한 과거 답변 리스트
     */
    public List<VectorSearchResult> searchSimilarAnswers(Long careTargetId, 
                                                         String queryText, 
                                                         int topK) {
        if (queryText == null || queryText.trim().isEmpty()) {
            log.warn("빈 쿼리 텍스트로 검색 시도: careTargetId={}", careTargetId);
            return Collections.emptyList();
        }
        
        try {
            // VectorStore를 사용하여 유사한 문서 검색
            // 주의: topK를 크게 설정한 후 필터링해야 함
            // (전체 데이터에서 상위 K개만 가져온 후 필터링하면 결과가 없을 수 있음)
            int searchTopK = Math.max(topK * 10, 50); // 필터링을 위해 더 많이 검색
            
            // similarityThreshold를 설정하지 않음 (기본값 사용)
            // 너무 높은 threshold는 결과를 필터링할 수 있음
            SearchRequest searchRequest = SearchRequest.builder()
                .query(queryText)
                .topK(searchTopK)
                // similarityThreshold 제거 - 기본값 사용
                .build();
            
            log.debug("검색 요청: query={}, topK={}", queryText, searchTopK);
            
            List<Document> results = vectorStore.similaritySearch(searchRequest);
            
            log.info("벡터 검색 결과 (필터링 전): careTargetId={}, 전체 결과={}개", 
                careTargetId, results.size());
            
            // 디버깅: 검색된 문서의 메타데이터 확인
            if (results.size() > 0) {
                log.info("검색된 문서 샘플 (최대 3개):");
                results.stream()
                    .limit(3)
                    .forEach(doc -> {
                        Map<String, Object> metadata = doc.getMetadata();
                        String contentPreview = doc.getText() != null && doc.getText().length() > 50
                            ? doc.getText().substring(0, 50) + "..."
                            : doc.getText();
                        log.info("  - 문서 ID: {}, 내용: {}, 메타데이터: {}", 
                            doc.getId(), contentPreview, metadata);
                    });
            } else {
                log.warn("검색 결과가 0개입니다. 가능한 원인:");
                log.warn("  1. 벡터DB에 데이터가 없음");
                log.warn("  2. 임베딩 생성이 완료되지 않음 (Ollama 비동기 처리)");
                log.warn("  3. Redis VectorStore 인덱스 문제");
                log.warn("  4. 검색 쿼리와 저장된 데이터의 유사도가 너무 낮음");
            }
            
            // careTargetId로 필터링하고 VectorSearchResult로 변환
            List<VectorSearchResult> filteredResults = results.stream()
                .filter(doc -> {
                    Map<String, Object> metadata = doc.getMetadata();
                    String docCareTargetId = (String) metadata.get("careTargetId");
                    return docCareTargetId != null && docCareTargetId.equals(careTargetId.toString());
                })
                .map(doc -> {
                    Map<String, Object> metadata = doc.getMetadata();
                    String question = (String) metadata.getOrDefault("question", "");
                    String answer = (String) metadata.getOrDefault("answer", doc.getText());
                    String timestamp = (String) metadata.getOrDefault("timestamp", "");
                    
                    // Spring AI VectorStore는 유사도를 직접 제공하지 않으므로 기본값 사용
                    // 필요시 Document의 distance 필드를 사용할 수 있음
                    double similarity = 1.0; // 기본값 (실제 유사도는 VectorStore 내부에서 계산됨)
                    
                    return VectorSearchResult.builder()
                        .question(question)
                        .answer(answer)
                        .timestamp(timestamp)
                        .similarity(similarity)
                        .build();
                })
                .limit(topK)
                .collect(Collectors.toList());
            
            log.info("벡터 검색 완료: careTargetId={}, 전체 결과={}개, 필터링 후={}개", 
                careTargetId, results.size(), filteredResults.size());
            
            // 디버깅: 필터링 전 결과의 careTargetId 확인
            if (results.size() > 0 && filteredResults.isEmpty()) {
                log.warn("필터링 후 결과가 없음. 검색된 문서들의 careTargetId 확인:");
                results.stream()
                    .limit(5)
                    .forEach(doc -> {
                        Map<String, Object> metadata = doc.getMetadata();
                        String docCareTargetId = (String) metadata.get("careTargetId");
                        log.warn("  - 문서 careTargetId: {}, 검색 대상: {}", docCareTargetId, careTargetId);
                    });
            }
            
            return filteredResults;
        } catch (Exception e) {
            log.error("벡터 검색 실패: careTargetId={}, error={}", careTargetId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}

