package com.carepilot.config;

import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.redis.RedisVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.JedisPooled;



@Configuration
@Profile("!test") // 테스트 환경에서는 이 Bean을 생성하지 않음
public class VectorDBConfig {


    // [컨테이너 1 설정값 주입] -----------------------------------------------
    @Value("${c1.redis.host}")
    private String redisHost;

    @Value("${c1.redis.port}")
    private int redisPort;

    @Value("${c1.vector.index-name}")
    private String indexName;

    @Value("${c1.vector.prefix}")
    private String prefix;

    // 저장소 2: 전화 대화 로그용 설정
    @Value("${c2.vector.index-name}")
    private String c2IndexName;

    @Value("${c2.vector.prefix}")
    private String c2Prefix;

    @Value("${c1.vector.initialize-schema:true}") // 추가: .env에 없으면 true를 기본값으로 사용
    private boolean initializeSchema;
// ---------------------------------------------------------------------

    @Bean
    public JedisPooled jedisPooled() {
        // 타임아웃 설정 추가
        JedisClientConfig clientConfig = DefaultJedisClientConfig.builder()
            .connectionTimeoutMillis(10000)  // 연결 타임아웃 10초
            .socketTimeoutMillis(30000)       // 소켓 타임아웃 30초 (임베딩 생성 시간 고려)
            .build();
        
        ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
        poolConfig.setMaxTotal(20);           // 최대 연결 수
        poolConfig.setMaxIdle(10);            // 최대 유휴 연결 수
        poolConfig.setMinIdle(2);             // 최소 유휴 연결 수
        
        return new JedisPooled(
            poolConfig,
            new HostAndPort(redisHost, redisPort),
            clientConfig
        );
    }

    @Bean(name = "c1VectorStore")
    public VectorStore vectorStore(OllamaEmbeddingModel embeddingModel, JedisPooled jedis) {
        return RedisVectorStore.builder(jedis, embeddingModel)
                .indexName(indexName)
                .prefix(prefix)
                .initializeSchema(initializeSchema)
                .build();
    }

    // [Bean 2] 전화 기록/시나리오 전용 저장소
    @Bean(name = "callLogVectorStore")
    public VectorStore callLogVectorStore(OllamaEmbeddingModel embeddingModel, JedisPooled jedis) {
        return RedisVectorStore.builder(jedis, embeddingModel)
                .indexName(c2IndexName)
                .prefix(c2Prefix)
                .initializeSchema(initializeSchema)
                .build();
    }
}