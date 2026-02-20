package com.carepilot.service.call;

import com.carepilot.repository.caretarget.CareTargetRepository;
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
 * 벡터DB 테스트 데이터 삽입 테스트
 * 
 * 사용 방법:
 * 1. insertSampleVectorData() - 샘플 질문-답변 데이터 삽입
 * 2. insertCustomVectorData() - 커스텀 데이터 삽입
 * 
 * @Commit 어노테이션으로 실제 벡터DB에 저장됩니다.
 * 
 * @ActiveProfiles("test") - 테스트 환경에서는 Mock VectorStore 사용 (Redis 불필요)
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Commit
@Log4j2
class CallVectorStoreServiceTests {

    @Autowired
    private CallVectorStoreService callVectorStoreService;
    
    @Autowired
    private CareTargetRepository careTargetRepository;

    /**
     * 샘플 질문-답변 데이터 삽입 테스트
     * 
     * 사용 방법:
     * 1. careTargetId를 실제 DB에 있는 ID로 변경
     * 2. 테스트 실행
     */
    @Test
    void insertSampleVectorData() {
        log.info("=== 벡터DB 샘플 데이터 삽입 시작 ===");
        
        // CareTarget ID (실제 DB에 있는 ID로 변경 필요)
        Long careTargetId = 3L;
        
        // 샘플 질문-답변 데이터
        List<TestQAData> sampleData = List.of(
            new TestQAData("식사는 하셨나요?", 
                          "아니, 입맛이 없어서 대충 때웠어.",
                          LocalDateTime.now().minusDays(3)),
            new TestQAData("오늘 컨디션은 어떠신가요?", 
                          "머리가 좀 지끈거리네.",
                          LocalDateTime.now().minusDays(2)),
            new TestQAData("약은 제대로 드셨나요?", 
                          "네, 아침에 다 드셨어요.",
                          LocalDateTime.now().minusDays(1)),
            new TestQAData("수면은 잘 주무셨나요?", 
                          "어제 밤에 잠을 잘 못 잤어요.",
                          LocalDateTime.now().minusDays(5)),
            new TestQAData("통증이 있으신가요?", 
                          "무릎이 좀 아파요.",
                          LocalDateTime.now().minusDays(7)),
            new TestQAData("식사는 하셨나요?", 
                          "네, 아침에 밥 먹었어요.",
                          LocalDateTime.now().minusDays(10)),
            new TestQAData("오늘 컨디션은 어떠신가요?", 
                          "오늘은 좀 괜찮아요.",
                          LocalDateTime.now().minusDays(12)),
            new TestQAData("입맛은 어떠신가요?", 
                          "요즘 입맛이 없어서 잘 안 먹어요.",
                          LocalDateTime.now().minusDays(15))
        );
        
        int successCount = 0;
        for (TestQAData data : sampleData) {
            try {
                callVectorStoreService.saveAnswerVector(
                    careTargetId,
                    data.question,
                    data.answer,
                    null, // embedding은 자동 생성
                    data.timestamp
                );
                successCount++;
                log.info("저장 완료: 질문={}, 답변={}", data.question, data.answer);
            } catch (Exception e) {
                log.error("저장 실패: 질문={}, error={}", data.question, e.getMessage());
            }
        }
        
        log.info("=== 벡터DB 샘플 데이터 삽입 완료: {}/{} 성공 ===", successCount, sampleData.size());
    }

    /**
     * 커스텀 질문-답변 데이터 삽입 테스트
     * 
     * 사용 방법:
     * 1. careTargetId와 데이터를 원하는 대로 수정
     * 2. 테스트 실행
     */
    @Test
    void insertCustomVectorData() {
        log.info("=== 벡터DB 커스텀 데이터 삽입 시작 ===");
        
        Long careTargetId = 1L; // 실제 CareTarget ID로 변경
        
        // 여기에 원하는 질문-답변 데이터 추가
        List<TestQAData> customData = List.of(
            new TestQAData("질문1", "답변1", LocalDateTime.now().minusDays(1)),
            new TestQAData("질문2", "답변2", LocalDateTime.now().minusDays(2))
            // 추가 데이터...
        );
        
        int successCount = 0;
        for (TestQAData data : customData) {
            try {
                callVectorStoreService.saveAnswerVector(
                    careTargetId,
                    data.question,
                    data.answer,
                    null,
                    data.timestamp
                );
                successCount++;
                log.info("저장 완료: 질문={}, 답변={}", data.question, data.answer);
            } catch (Exception e) {
                log.error("저장 실패: 질문={}, error={}", data.question, e.getMessage());
            }
        }
        
        log.info("=== 벡터DB 커스텀 데이터 삽입 완료: {}/{} 성공 ===", successCount, customData.size());
    }

    /**
     * 테스트용 질문-답변 데이터 클래스
     */
    private static class TestQAData {
        String question;
        String answer;
        LocalDateTime timestamp;

        TestQAData(String question, String answer, LocalDateTime timestamp) {
            this.question = question;
            this.answer = answer;
            this.timestamp = timestamp;
        }
    }
}

