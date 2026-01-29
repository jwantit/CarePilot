package com.carepilot.config;



import org.springframework.ai.ollama.OllamaEmbeddingModel;

import org.springframework.ai.vectorstore.VectorStore;

import org.springframework.ai.vectorstore.redis.RedisVectorStore;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;

import redis.clients.jedis.JedisPooled;



@Configuration

public class VectorDBConfig {


    // [컨테이너 1 설정값 주입] -----------------------------------------------
    @Value("${REDIS_HOST}")
    private String redisHost;

    @Value("${REDIS_PORT}")
    private int redisPort;

    @Value("${VECTOR_INDEX_NAME}")
    private String indexName;

    @Value("${VECTOR_PREFIX}")
    private String prefix;

    @Value("${VECTOR_INIT_SCHEMA:true}") // 추가: .env에 없으면 true를 기본값으로 사용
    private boolean initializeSchema;
// ---------------------------------------------------------------------

    @Bean(name = "c1VectorStore")
    public VectorStore vectorStore(OllamaEmbeddingModel embeddingModel) {
        JedisPooled jedis = new JedisPooled(redisHost, redisPort);
        return RedisVectorStore.builder(jedis, embeddingModel)
                .indexName(indexName)
                .prefix(prefix)
                .initializeSchema(initializeSchema)
                .build();

    }
}