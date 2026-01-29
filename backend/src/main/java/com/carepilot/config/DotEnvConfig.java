package com.carepilot.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
@Log4j2
public class DotEnvConfig {
    
    @PostConstruct
    public void loadEnv() {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")  // 프로젝트 루트에서 .env 파일 찾기
                    .ignoreIfMissing()  // .env 파일이 없어도 에러 발생 안 함
                    .load();
            
            // .env 파일의 변수들을 시스템 환경 변수로 설정
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                System.setProperty(key, value);
                // 민감한 정보는 일부만 로그 출력
                if (key.contains("TOKEN") || key.contains("SECRET") || key.contains("PASSWORD")) {
                    log.info("환경 변수 로드: {} = {}", key, value != null && value.length() > 10 
                        ? value.substring(0, 10) + "..." : "***");
                } else {
                    log.info("환경 변수 로드: {} = {}", key, value);
                }
            });
            
            log.info(".env 파일 로드 완료");
        } catch (Exception e) {
            log.warn(".env 파일 로드 실패: {}", e.getMessage());
        }
    }
}

