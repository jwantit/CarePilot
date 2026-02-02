package com.carepilot.common.loader;

import com.carepilot.service.call.vector.CallVectorStoreService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 로컬 프로파일에서만 실행되는 통화 RAG 더미 데이터 로더
 * 서버 시작 시 JSON 파일에서 더미 데이터를 읽어 벡터 스토어에 저장합니다.
 */
@Component
@Profile("local")
@RequiredArgsConstructor
@Log4j2
public class CallRagDataLoader implements CommandLineRunner {
    
    private final CallVectorStoreService callVectorStoreService;
    private final ObjectMapper objectMapper;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("=== 통화 RAG 더미 데이터 로드 시작 ===");
        
        try {
            // JSON 파일 읽기
            ClassPathResource resource = new ClassPathResource("data/call-rag-dummy-data.json");
            
            if (!resource.exists()) {
                log.warn("더미 데이터 파일을 찾을 수 없습니다: data/call-rag-dummy-data.json");
                return;
            }
            
            InputStream inputStream = resource.getInputStream();
            
            // JSON 파싱
            List<Map<String, Object>> dataList = objectMapper.readValue(
                inputStream, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
            );
            
            log.info("더미 데이터 개수: {}개", dataList.size());
            
            int successCount = 0;
            int failCount = 0;
            
            // 각 데이터를 벡터 스토어에 저장
            for (int i = 0; i < dataList.size(); i++) {
                Map<String, Object> data = dataList.get(i);
                try {
                    Long careTargetId = Long.valueOf(data.get("careTargetId").toString());
                    String question = (String) data.getOrDefault("question", "");
                    String answer = (String) data.get("answer");
                    String timestampStr = (String) data.get("timestamp");
                    
                    if (answer == null || answer.trim().isEmpty()) {
                        log.warn("빈 답변 데이터 건너뜀: careTargetId={}", careTargetId);
                        failCount++;
                        continue;
                    }
                    
                    LocalDateTime callDateTime = LocalDateTime.parse(
                        timestampStr, 
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                    );
                    
                    // 고정 Document ID 생성 (중복 방지)
                    // 형식: dummy_data_{careTargetId}_{index}
                    String documentId = String.format("dummy_data_%d_%03d", careTargetId, i + 1);
                    
                    // 더미 데이터 전용 메서드로 저장 (고정 ID 사용)
                    callVectorStoreService.saveDummyAnswerVector(
                        documentId,
                        careTargetId,
                        question,
                        answer,
                        callDateTime
                    );
                    
                    successCount++;
                    
                    if (successCount % 10 == 0) {
                        log.info("진행 상황: {}/{} 완료", successCount, dataList.size());
                    }
                } catch (Exception e) {
                    log.error("데이터 저장 실패: data={}, error={}", data, e.getMessage());
                    failCount++;
                }
            }
            
            log.info("=== 통화 RAG 더미 데이터 로드 완료 ===");
            log.info("성공: {}개, 실패: {}개", successCount, failCount);
            log.info("참고: 고정 Document ID를 사용하므로 서버 재시작 시 중복 저장되지 않습니다.");
            
        } catch (Exception e) {
            log.error("더미 데이터 로드 실패: {}", e.getMessage(), e);
        }
    }
}

