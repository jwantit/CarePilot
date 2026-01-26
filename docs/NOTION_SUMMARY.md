# **1. 금일 작업 리스트**

- 카카오 소셜 로그인 OAuth2 연동 구현
- OAuth2SuccessHandler 구현 (카카오 인증 성공 시 처리)
- OAuth2Service 구현 (ADMIN/USER 소셜 회원가입 로직)
- 소셜 회원가입 API 엔드포인트 추가 (`POST /auth/oauth2/signup/admin`, `POST /auth/oauth2/signup/user`)
- Postman 테스트 가이드 작성 및 테스트 완료

---

# **2. 금일 목표**

- 카카오 소셜 로그인 기본 구조 구현 완료
- Role별 소셜 회원가입 처리 (ADMIN: 즉시 ACTIVE, USER: WAITING + 승인 메일 발송)
- Postman으로 소셜 회원가입 API 테스트 완료

---

# **3. Development Work (개발 작업 상세 기록)**

## 3.1 카카오 소셜 로그인 전체 흐름도

```
[사용자] 
  ↓
[카카오 로그인 버튼 클릭]
  ↓
[카카오 인증 페이지]
  ↓
[인증 완료] → http://localhost:8080/login/oauth2/code/kakao
  ↓
[OAuth2SuccessHandler]
  ├─ 카카오 사용자 정보 추출 (email, name, providerId)
  ├─ OAuth2Service.processKakaoLogin() 호출
  └─ JSON 응답 반환
  ↓
[기존 사용자?]
  ├─ YES → [ACTIVE?]
  │   ├─ YES → JWT 토큰 발급 → 로그인 완료
  │   └─ NO → 승인 대기 메시지
  └─ NO → 추가 정보 입력 필요 응답
  ↓
[프론트엔드]
  ├─ Role 선택 (ADMIN / USER)
  ├─ USER 선택 시 organization_number 입력
  └─ POST /auth/oauth2/signup/{role} 호출
  ↓
[ADMIN 회원가입]
  ├─ 즉시 ACTIVE
  └─ JWT 토큰 발급
  ↓
[USER 회원가입]
  ├─ WAITING 상태
  ├─ 승인 토큰 생성
  ├─ MANAGER에게 승인 메일 발송
  └─ 승인 대기 응답
```

## 3.2 핵심 코드

### OAuth2SuccessHandler - 카카오 인증 성공 시 처리

```java
@Override
public void onAuthenticationSuccess(...) {
    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    Map<String, Object> attributes = oAuth2User.getAttributes();

    // 카카오 사용자 정보 추출
    String email = extractEmail(attributes);
    String name = extractName(attributes);
    String providerId = oAuth2User.getName();

    // OAuth2Service를 통해 로그인/회원가입 처리
    OAuth2LoginResponseDTO loginResponse = oAuth2Service.processKakaoLogin(email, name, providerId);
    
    // JSON 응답 반환
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    String jsonResponse = gson.toJson(loginResponse);
    writer.println(jsonResponse);
}
```

### OAuth2ServiceImpl - 소셜 로그인/회원가입 로직

```java
// 기존 사용자 로그인 처리
@Override
public OAuth2LoginResponseDTO processKakaoLogin(String email, String name, String providerId) {
    User existingUser = userRepository.findByEmail(email).orElse(null);
    
    if (existingUser != null) {
        // ACTIVE면 JWT 토큰 발급
        if (existingUser.getStatus() == UserStatus.ACTIVE) {
            String accessToken = jwtUtil.generateAccessToken(...);
            String refreshToken = jwtUtil.generateRefreshToken(existingUser.getUserId());
            return OAuth2LoginResponseDTO.success(accessToken, refreshToken, ...);
        }
        // WAITING이면 승인 대기
        if (existingUser.getStatus() == UserStatus.WAITING) {
            return OAuth2LoginResponseDTO.waitingApproval();
        }
    }
    
    // 신규 사용자 - 추가 정보 입력 필요
    return OAuth2LoginResponseDTO.requiresAdditionalInfo("추가 정보 입력이 필요합니다...");
}

// USER 소셜 회원가입 (승인 메일 발송)
public OAuth2LoginResponseDTO signupUser(String email, String name, String organizationNumber) {
    Organization organization = organizationRepository.findByOrganizationNumber(organizationNumber)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 조직 번호입니다."));
    
    User user = User.builder()
        .email(email)
        .password(null)  // 소셜 로그인은 password 없음
        .role(UserRole.USER)
        .organization(organization)
        .status(UserStatus.WAITING)
        .build();
    user = userRepository.save(user);
    
    // MANAGER에게 승인 메일 발송
    String approvalToken = approvalService.generateToken(user.getUserId());
    String approvalLink = approvalService.generateApprovalLink(approvalToken);
    List<User> managers = userRepository.findByOrganizationAndRole(organization, UserRole.MANAGER);
    for (User manager : managers) {
        approvalService.sendApprovalRequestEmail(manager.getEmail(), user.getName(), user.getEmail(), approvalLink);
    }
    
    return OAuth2LoginResponseDTO.waitingApproval();
}
```

### SecurityConfig - OAuth2 설정 추가

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        
        // OAuth2 설정
        .oauth2Login(oauth2 -> oauth2
            .successHandler(oAuth2SuccessHandler)
        )
        
        // 인증/인가 설정
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
            .requestMatchers("/auth/**").permitAll()
            .anyRequest().authenticated()
        )
        
        .addFilterBefore(jwtCheckFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

### application.properties - 카카오 OAuth2 설정

```properties
spring.security.oauth2.client.registration.kakao.client-id=9c3ff0b1db60e60ac1bdbfdef860e212
spring.security.oauth2.client.registration.kakao.client-secret=gexMBOTG8hll3steeMdV8Xxhe5P6HQXe
spring.security.oauth2.client.registration.kakao.redirect-uri=http://localhost:8080/login/oauth2/code/kakao
spring.security.oauth2.client.registration.kakao.scope=profile_nickname,account_email

spring.security.oauth2.client.provider.kakao.authorization-uri=https://kauth.kakao.com/oauth/authorize
spring.security.oauth2.client.provider.kakao.token-uri=https://kauth.kakao.com/oauth/token
spring.security.oauth2.client.provider.kakao.user-info-uri=https://kapi.kakao.com/v2/user/me
```

### Postman 테스트 API

**ADMIN 소셜 회원가입**
```
POST http://localhost:8080/auth/oauth2/signup/admin

Body:
{
  "email": "admin@kakao.com",
  "name": "카카오 관리자"
}
```

**USER 소셜 회원가입**
```
POST http://localhost:8080/auth/oauth2/signup/user

Body:
{
  "email": "user@kakao.com",
  "name": "카카오 직원",
  "organizationNumber": "ABC-12345"
}
```

---

# **4. Issue & Troubleshooting (문제 발생 & 해결 과정)**

## 🟥 발생한 문제 1: OAuth2 의존성 추가 후 빌드 오류

### 문제 상황
- `spring-boot-starter-oauth2-client` 의존성 추가 후 빌드 시 `OAuth2User` 타입을 찾을 수 없다는 오류 발생
- `OAuth2SuccessHandler`에서 `OAuth2User` import 실패

### 원인 분석
- OAuth2 Client 의존성이 제대로 추가되지 않았거나
- Spring Security OAuth2 관련 클래스가 클래스패스에 없음
- `build.gradle`에 의존성이 추가되었지만 Gradle 빌드가 제대로 반영되지 않음

### 해결 방법
1. `build.gradle`에 의존성 추가 확인:
```gradle
implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
```

2. Gradle 빌드 캐시 정리 및 재빌드:
```bash
./gradlew clean build -x test
```

3. IDE에서 프로젝트 새로고침 (Gradle Reload)

### 해결 결과
- 빌드 성공
- `OAuth2User`, `OAuth2SuccessHandler` 정상 작동
- OAuth2 인증 플로우 정상 동작 확인

---

## 🟥 발생한 문제 2: USER 소셜 회원가입 시 승인 메일 발송 실패

### 문제 상황
- `OAuth2ServiceImpl.signupUser` 메서드에서 승인 메일 발송 시 `ApprovalService.sendApprovalEmail()` 메서드를 호출했으나 메서드가 존재하지 않음
- 컴파일 오류: `The method sendApprovalEmail(User) is undefined for the type ApprovalService`

### 원인 분석
- `ApprovalService` 인터페이스의 실제 메서드명은 `sendApprovalRequestEmail()`임
- 메서드 시그니처가 다름:
  - 잘못된 호출: `sendApprovalEmail(User user)`
  - 올바른 호출: `sendApprovalRequestEmail(String managerEmail, String userName, String userEmail, String approvalLink)`

### 해결 방법
1. `ApprovalService` 인터페이스 확인:
```java
void sendApprovalRequestEmail(String managerEmail, String userName, String userEmail, String approvalLink);
```

2. `OAuth2ServiceImpl`에서 올바른 메서드 호출로 수정:
```java
// 승인 토큰 생성 및 링크 생성
String approvalToken = approvalService.generateToken(user.getUserId());
String approvalLink = approvalService.generateApprovalLink(approvalToken);

// 조직의 MANAGER 조회
List<User> managers = userRepository.findByOrganizationAndRole(organization, UserRole.MANAGER);

// MANAGER에게 승인 메일 발송
for (User manager : managers) {
    approvalService.sendApprovalRequestEmail(
        manager.getEmail(),
        user.getName(),
        user.getEmail(),
        approvalLink
    );
}
```

### 해결 결과
- 컴파일 오류 해결
- USER 소셜 회원가입 시 MANAGER에게 승인 메일 정상 발송
- 승인 링크 클릭 시 승인 처리 정상 동작 확인

---

## 🟦 해결 결과

- 모든 빌드 오류 해결
- 카카오 소셜 로그인 플로우 정상 동작
- ADMIN/USER 소셜 회원가입 정상 작동
- 승인 메일 발송 및 승인 처리 정상 동작

