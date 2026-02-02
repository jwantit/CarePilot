package com.carepilot.config;


import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.ollama.management.ModelManagementOptions;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.redis.RedisVectorStore;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.*;
import redis.clients.jedis.search.Schema;

@Configuration
@Profile("!test") // 테스트 환경에서는 이 Bean을 생성하지 않음
public class VectorDBConfig {

    //공용
    @Value("${c1.redis.host}")
    private String redisHost;

    @Value("${c1.redis.port}")
    private int redisPort;

    @Value("${VECTOR_INIT_SCHEMA:true}")
    private boolean initializeSchema;

    //저장소1
    @Value("${c1.vector.index-name}")
    private String c1indexName;

    @Value("${c1.vector.prefix}")
    private String c1prefix;

    // 저장소 2: 전화 대화 로그용 설정
    @Value("${c2.vector.index-name}")
    private String c2IndexName;

    @Value("${c2.vector.prefix}")
    private String c2Prefix;
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

    @Bean
    public ObservationRegistry observationRegistry() {
        return ObservationRegistry.create(); // 빈을 수동으로 생성하여 등록합니다.
    }


    //임베딩 모델 기존
    @Value("${spring.ai.ollama.embedding.options.model}")
    private String mxbaiModelName;

    //bge
    @Value("${spring.ai.ollama.embedding.options.model.bge}")
    private String bgeModelName;


   //임베딩 옵션1 BGE3-----------------------------------------------------------------------------------------------
    @Bean
    public OllamaEmbeddingModel bgeEmbeddingModel(OllamaApi ollamaApi, ObservationRegistry observationRegistry) {
        return new OllamaEmbeddingModel(
                ollamaApi,
                OllamaOptions.builder().model(bgeModelName).build(),
                observationRegistry,
                ModelManagementOptions.builder().build()   // 또는 ModelManagementOptions.defaults()
        );
    }
    //-----------------------------------------------------------------------------------------------------
    //임베딩 옵션2 MXDAI-------------------------------------------------------------------------------------------
    @Primary
    @Bean
    public OllamaEmbeddingModel mxbaiEmbeddingModel(OllamaApi ollamaApi, ObservationRegistry observationRegistry) {
        return new OllamaEmbeddingModel(
                ollamaApi,
                OllamaOptions.builder()
                        .model(mxbaiModelName) // model() 사용
                        .build(),
                observationRegistry, // 주입받은 registry를 그대로 사용
                ModelManagementOptions.builder().build()   // 또는 ModelManagementOptions.defaults()
        );
    }
    //-----------------------------------------------------------------------------------------------------


        //bg3 임베팅 + 저장소1-----------------------------------------------------------------------------------------------------
        @Bean(name = "ChatBotVectorStore")
        public VectorStore ChatBotVectorStore(@Qualifier("bgeEmbeddingModel") OllamaEmbeddingModel embeddingModel) {
            JedisPooled jedis = new JedisPooled(redisHost, redisPort);
            return RedisVectorStore.builder(jedis, embeddingModel)
                    .indexName(c1indexName)
                    .prefix(c1prefix)
                    .initializeSchema(initializeSchema)
                    .metadataFields(
                            new RedisVectorStore.MetadataField("organizationId", Schema.FieldType.NUMERIC),
                            new RedisVectorStore.MetadataField("careTargetId", Schema.FieldType.NUMERIC),
                            new RedisVectorStore.MetadataField("careTargetName", Schema.FieldType.TAG),
                            new RedisVectorStore.MetadataField("groupIds", Schema.FieldType.TAG),
                            new RedisVectorStore.MetadataField("scheduleIds", Schema.FieldType.TAG)
                    ).build();
        }


//mxbai 임베팅 + 저장소2-----------------------------------------------------------------------------------------------------
    // [Bean 2] 전화 기록/시나리오 전용 저장소
    @Bean(name = "callLogVectorStore")
    public VectorStore callLogVectorStore(@Qualifier("mxbaiEmbeddingModel") OllamaEmbeddingModel embeddingModel, JedisPooled jedis) {
        return RedisVectorStore.builder(jedis, embeddingModel)
                .indexName(c2IndexName)
                .prefix(c2Prefix)
                .initializeSchema(initializeSchema)
                .build();
    }//---------------------------------------------------------------------------------------------------

//AI대화 단기 기억 저장소--------------------------------------------------------
    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }
    //------------------------------------------------------------------------
}