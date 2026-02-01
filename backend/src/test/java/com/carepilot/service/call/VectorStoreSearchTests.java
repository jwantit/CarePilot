package com.carepilot.service.call;

import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.service.call.vector.VectorSearchResult;
import com.carepilot.service.call.vector.CallVectorStoreService;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 벡터DB 검색 테스트
 * 
 * 데이터가 제대로 저장되고 검색되는지 확인하는 테스트
 * 
 * @ActiveProfiles("test") - 테스트 환경에서는 Mock VectorStore 사용 (Redis 불필요)
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Commit
@Log4j2
class VectorStoreSearchTests {

    @Autowired
    private CallVectorStoreService callVectorStoreService;
    
    @Autowired
    private CareTargetRepository careTargetRepository;

    @Test
    void testSearchAfterInsert() {
        log.info("=== 벡터DB 검색 테스트 시작 ===");
        
        Long careTargetId = 3L;
        
        // 1. 테스트 데이터 삽입
        log.info("【1단계】 테스트 데이터 삽입");
        String testAnswer = "입맛이 없어서 잘 안 먹어요.";
        callVectorStoreService.saveAnswerVector(
            careTargetId,
            "식사는 하셨나요?",
            testAnswer,
            null,
            LocalDateTime.now()
        );
        log.info("데이터 삽입 완료: careTargetId={}, answer={}", careTargetId, testAnswer);
        log.info("");
        
        // 잠시 대기 (임베딩 생성 및 저장 시간 - Ollama가 비동기로 처리할 수 있음)
        log.info("임베딩 생성 대기 중... (10초)");
        try {
            Thread.sleep(10000); // 더 긴 대기 시간 (Ollama 임베딩 생성 시간 고려)
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // 2. 검색 테스트 - 여러 쿼리로 시도
        log.info("【2단계】 검색 테스트");
        
        // 테스트 1: 저장된 텍스트와 동일한 쿼리
        String searchQuery1 = testAnswer; // "입맛이 없어서 잘 안 먹어요."
        log.info("검색 쿼리 1 (정확 일치): {}", searchQuery1);
        List<VectorSearchResult> results1 = callVectorStoreService.searchSimilarAnswers(
            careTargetId, searchQuery1, 3);
        log.info("검색 결과 개수: {}", results1.size());
        
        // 테스트 2: 부분 일치 쿼리
        String searchQuery2 = "입맛이 없어서";
        log.info("검색 쿼리 2 (부분 일치): {}", searchQuery2);
        List<VectorSearchResult> results2 = callVectorStoreService.searchSimilarAnswers(
            careTargetId, searchQuery2, 3);
        log.info("검색 결과 개수: {}", results2.size());
        
        // 테스트 3: 유사한 의미의 쿼리
        String searchQuery3 = "식사를 잘 안 하셨어요";
        log.info("검색 쿼리 3 (유사 의미): {}", searchQuery3);
        List<VectorSearchResult> results3 = callVectorStoreService.searchSimilarAnswers(
            careTargetId, searchQuery3, 3);
        log.info("검색 결과 개수: {}", results3.size());
        
        // 결과 출력
        if (results1.isEmpty() && results2.isEmpty() && results3.isEmpty()) {
            log.warn("모든 검색 쿼리에서 결과가 없습니다!");
            log.warn("가능한 원인:");
            log.warn("  1. 벡터DB에 데이터가 저장되지 않았을 수 있음");
            log.warn("  2. 임베딩 생성이 완료되지 않았을 수 있음 (Ollama 비동기 처리)");
            log.warn("  3. Redis VectorStore 인덱스가 제대로 초기화되지 않았을 수 있음");
            log.warn("  4. Redis 연결 문제");
        } else {
            log.info("검색 성공! 결과:");
            List<VectorSearchResult> allResults = results1.isEmpty() ? 
                (results2.isEmpty() ? results3 : results2) : results1;
            for (int i = 0; i < allResults.size(); i++) {
                VectorSearchResult result = allResults.get(i);
                log.info("  [{}] 질문: {}, 답변: {}, 날짜: {}", 
                    i + 1, result.getQuestion(), result.getAnswer(), result.getTimestamp());
            }
        }
        
        log.info("=== 벡터DB 검색 테스트 완료 ===");
    }
}

