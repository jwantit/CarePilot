package com.carepilot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF 비활성화 (JWT 사용하므로)
            .csrf(AbstractHttpConfigurer::disable)
            
            // CORS 설정
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Stateless 설정 (세션 사용 안 함)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 인증/인가 설정
            .authorizeHttpRequests(auth -> auth
                // 인증 엔드포인트는 모두 허용
                .requestMatchers("/auth/**").permitAll()
                // 나머지는 인증 필요 (추후 JWT 필터 추가 시 활성화)
                .anyRequest().permitAll() // 개발 단계: 모든 요청 허용
                // .anyRequest().authenticated() // 프로덕션: 인증 필요
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 모든 origin 허용 (개발용)
        configuration.setAllowedOrigins(List.of("*"));
        
        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("*"));
        
        // 인증 정보 허용 (JWT 토큰 전송용)
        configuration.setAllowCredentials(false); // * origin 사용 시 false
        
        // preflight 요청 캐시 시간
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}

