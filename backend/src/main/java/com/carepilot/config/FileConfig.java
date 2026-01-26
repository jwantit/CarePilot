package com.carepilot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class FileConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. 실제 파일이 저장되는 물리적인 루트 폴더 (서비스에서 사용한 BASE_DIR과 일치)
        String baseDir = "uploads";

        // 2. 운영체제에 맞는 절대 경로 추출
        String absolutePath = new File(baseDir).getAbsolutePath();

        // 3. 리소스 핸들러 등록
        // /display/ 로 시작하는 요청이 오면 실제 로컬 파일 시스템의 absolutePath 폴더에서 파일을 찾음
        registry.addResourceHandler("/display/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}