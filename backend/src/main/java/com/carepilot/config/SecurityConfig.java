package com.carepilot.config;

import java.util.Arrays;
import java.util.List;

import com.carepilot.security.filter.JwtCheckFilter;
import com.carepilot.security.handler.LoginAccessDeniedHandler;
import com.carepilot.security.handler.LoginFailHandler;
import com.carepilot.security.handler.LoginSuccessHandler;
import com.carepilot.security.handler.OAuth2SuccessHandler;
import com.carepilot.security.service.AuthUserDetailsService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Configuration
@Log4j2
@RequiredArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtCheckFilter jwtCheckFilter;
    private final LoginAccessDeniedHandler loginAccessDeniedHandler;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final AuthUserDetailsService authUserDetailsService;
    private final LoginSuccessHandler loginSuccessHandler;
    private final LoginFailHandler loginFailHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        log.info("---------------------security config---------------------------");

        http.cors(httpSecurityCorsConfigurer -> {
            httpSecurityCorsConfigurer.configurationSource(corsConfigurationSource());
        });

        http.sessionManagement(sessionConfig ->
            sessionConfig.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        http.csrf(config -> config.disable())
            .authorizeHttpRequests(auth -> auth
                // 공개 엔드포인트 (구체적인 것부터)
                .requestMatchers("/auth/signup/**", "/auth/approve", "/auth/logout").permitAll()
                .requestMatchers("/display/**").permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // 인증 필요한 엔드포인트 (구체적인 것부터)
                .requestMatchers("/auth/me").authenticated()
                // 나머지 인증 API는 허용
                .requestMatchers("/auth/**").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
                );

        // 폼 로그인 설정
        http.formLogin(form -> form
                .loginProcessingUrl("/login")  // Spring Security 기본 경로
                .usernameParameter("email")     // 이메일을 username으로 사용
                .passwordParameter("password")  // 비밀번호 파라미터
                .successHandler(loginSuccessHandler)
                .failureHandler(loginFailHandler)
                .permitAll()
        );

        // OAuth2 설정
        http.oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
        );

        // UserDetailsService 설정
        http.userDetailsService(authUserDetailsService);

        // JWT 필터 추가
        http.addFilterBefore(jwtCheckFilter, UsernamePasswordAuthenticationFilter.class);

        // 인증은 됐는데 권한이 없을 때 실행되는 핸들러
        // @PreAuthorize("hasRole('ADMIN')") 로 설정된 주소에 'USER' 가 접근 시 발생
        http.exceptionHandling(config -> {
            config.accessDeniedHandler(loginAccessDeniedHandler);             // 403 처리 (권한 부족)
            // 401 처리 (인증 실패)는 JwtCheckFilter에서 직접 처리하므로 별도 핸들러 불필요
        });

        return http.build();
    }

    // Spring Security / Spring MVC에서 CORS(Cross-Origin Resource Sharing) 정책을 정의하는 설정
    // 프론트엔드(다른 출처)에서 우리 백엔드 API를 호출해도 되게 허용 규칙을 정한 것
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // 구체적인 origin 허용 (운영 환경에서는 특정 도메인으로 제한)
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("HEAD", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 허용할 헤더
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));

        // 인증 정보 허용
        configuration.setAllowCredentials(true);

        // preflight 요청 캐시 시간
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

