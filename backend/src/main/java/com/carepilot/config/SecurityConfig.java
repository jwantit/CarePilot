package com.carepilot.config;

import com.carepilot.security.filter.JwtCheckFilter;
import com.carepilot.security.handler.JwtAccessDeniedHandler;
import com.carepilot.security.handler.JwtAuthenticationFailHandler;
import com.carepilot.security.handler.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtCheckFilter jwtCheckFilter;
    private final JwtAuthenticationFailHandler jwtAuthenticationFailHandler;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

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

            // OAuth2 설정
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)  // OAuth2 인증 성공 핸들러
            )

            // 인증/인가 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()      // 인증 API 허용
                .requestMatchers("/display/**").permitAll()
                // OAuth2 인증 엔드포인트 허용
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                // WebSocket 엔드포인트 허용
                .requestMatchers("/ws/**").permitAll()
                // 로그아웃은 인증 필요
                .requestMatchers("/auth/logout").authenticated()
                // 나머지 인증 엔드포인트는 모두 허용
                .requestMatchers("/auth/**").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )

//            // JWT 필터 추가 (UsernamePasswordAuthenticationFilter 앞에 추가)
            .addFilterBefore(jwtCheckFilter, UsernamePasswordAuthenticationFilter.class)

            // 예외 처리
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationFailHandler)  // 401 처리 (인증 실패)
                .accessDeniedHandler(jwtAccessDeniedHandler)             // 403 처리 (권한 부족)
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 구체적인 origin 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("*"));

        // 인증 정보 허용 (구체적인 origin 사용 시 true 가능)
        configuration.setAllowCredentials(true);

        // preflight 요청 캐시 시간
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

