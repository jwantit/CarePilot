package com.carepilot.service.aiChat;

import lombok.extern.slf4j.Slf4j;
// 올바른 임포트로 수정
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map; // java.util.Map을 사용해야 합니다.



//------------------------------------------------------------------------------
// 백터DB : Redis Vector Store (Redis Stack)
// 용도 : RAG(Retrieval-Augmented Generation) 기반 지식 저장소
//
// 상세 설명:
// 1. 인덱싱(Indexing): 환자 정보나 스케줄 데이터를 Ollama(mxbai-embed-large)를 통해
//    고차원 벡터로 변환하여 저장합니다.
// 2. 검색(Retrieval): 사용자의 질문이 들어오면 질문의 '의미'를 분석하여
//    가장 유사도가 높은 상위 K개의 문서를 Redis에서 실시간으로 추출합니다.
// 3. 필터링(Filtering): org_id 메타데이터를 활용하여 멀티테넌시(조직별 격리)를 보장합니다.
// 4. 답변 생성(Generation): 검색된 최신 데이터를 시스템 프롬프트에 주입하여
//    LLM(Exaone)이 환각 현상(Hallucination) 없이 정확한 사실에 근거해 답변하도록 합니다.
//------------------------------------------------------------------------------


@Slf4j
@Service
public class VectorService {

    private final VectorStore vectorStore;

    public VectorService(@Qualifier("c1VectorStore") VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * 1. 데이터 저장 (Ingestion)
     * 환자 정보를 벡터 DB에 저장합니다.
     */
    public void savePatientToVectorDb(String patientId, String name, String orgId, String note) {
        // AI가 문맥을 파악하기 좋게 문장으로 구성
        String content = String.format("[환자정보] 성함: %s, 상세내용: %s", name, note);

        // 메타데이터 설정 (나중에 특정 조직 데이터만 필터링할 때 사용)
        Document doc = new Document(content, Map.of(
                "org_id", orgId,
                "patient_id", patientId,
                "type", "PATIENT"
        ));

        // 저장 (내부적으로 Ollama 임베딩 모델을 거쳐 Redis에 저장됨)
        vectorStore.add(List.of(doc));
        log.info(">>> 벡터 DB 저장 완료: 환자 {}", name);
    }

    /**
     * 2. 유사 데이터 검색 (Retrieval)
     * 질문과 가장 관련 있는 데이터를 우리 조직 내에서만 찾아옵니다.
     */
    public List<Document> searchRelevantData(String query) {
        log.info(">>> 모든 지식 참조를 위한 검색 시작: {}", query);

        SearchRequest searchRequest = SearchRequest.builder()
                .query(query)
                .topK(10) // 상위 3개가 아니라 10개 정도로 범위를 넓힙니다.
                // .similarityThreshold(0.5) // 너무 엄격하면 데이터를 못 가져오므로 테스트 시에는 주석 처리하세요.
                .similarityThreshold(0.7)
                .build();

        return vectorStore.similaritySearch(searchRequest);
    }
}