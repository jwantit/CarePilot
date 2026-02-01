package com.carepilot.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 테스트용 VectorStore Mock 구현
 * 
 * Redis 없이도 테스트가 가능하도록 메모리 기반 VectorStore를 제공합니다.
 * 실제 벡터 검색은 하지 않고, 텍스트 매칭 기반으로 동작합니다.
 */
@Configuration
@Profile("test")
@Log4j2
public class TestVectorConfig {

    @Bean(name = "c1VectorStore")
    @Primary
    public VectorStore testVectorStore() {
        return new InMemoryTestVectorStore();
    }

    @Bean(name = "callLogVectorStore")
    public VectorStore testCallLogVectorStore() {
        return new InMemoryTestVectorStore();
    }

    /**
     * 메모리 기반 테스트용 VectorStore 구현
     */
    private static class InMemoryTestVectorStore implements VectorStore {
        private final Map<String, Document> documents = new ConcurrentHashMap<>();
        private final Map<String, Map<String, Object>> metadataMap = new ConcurrentHashMap<>();

        @Override
        public void add(List<Document> documents) {
            for (Document doc : documents) {
                String id = doc.getId() != null ? doc.getId() : UUID.randomUUID().toString();
                this.documents.put(id, doc);
                this.metadataMap.put(id, new HashMap<>(doc.getMetadata()));
                log.debug("테스트 VectorStore에 문서 추가: id={}, content={}", 
                    id, doc.getContent() != null && doc.getContent().length() > 50 
                        ? doc.getContent().substring(0, 50) + "..." 
                        : doc.getContent());
            }
            log.info("테스트 VectorStore에 {}개 문서 추가 완료", documents.size());
        }

        @Override
        public Optional<Boolean> delete(List<String> idList) {
            int deleted = 0;
            for (String id : idList) {
                if (documents.remove(id) != null) {
                    metadataMap.remove(id);
                    deleted++;
                }
            }
            log.debug("테스트 VectorStore에서 {}개 문서 삭제", deleted);
            return Optional.of(deleted > 0);
        }

        @Override
        public List<Document> similaritySearch(SearchRequest searchRequest) {
            String query = searchRequest.getQuery();
            int topK = searchRequest.getTopK();
            
            log.debug("테스트 VectorStore 검색: query={}, topK={}", query, topK);
            
            if (query == null || query.trim().isEmpty()) {
                return Collections.emptyList();
            }

            // 간단한 텍스트 매칭 기반 검색 (실제 벡터 검색 대신)
            List<Document> results = documents.values().stream()
                .filter(doc -> {
                    String content = doc.getContent();
                    if (content == null) return false;
                    // 쿼리가 내용에 포함되어 있거나, 내용이 쿼리에 포함되어 있으면 매칭
                    return content.toLowerCase().contains(query.toLowerCase()) 
                        || query.toLowerCase().contains(content.toLowerCase());
                })
                .limit(topK)
                .collect(Collectors.toList());

            log.debug("테스트 VectorStore 검색 결과: {}개", results.size());
            return results;
        }
    }
}

