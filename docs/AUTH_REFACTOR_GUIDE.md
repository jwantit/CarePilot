WT 기반 인증/인가 구조 리팩토링 가이드

목적
기존 프로젝트의 JWT 인증/인가 구조를 아래에 다른 프로젝트에 구조랑 비슷하게 리팩토링한다.
도메인/네이밍 차이는 허용하되, 레이어 구조·책임·흐름은 비슷하게 유지한다.

1. 리팩토링 기본 원칙
1.1 유지해야 할 것 (Mandatory)

JWT 기반 인증 구조

Spring Security + Filter 기반 인증 처리

SecurityConfig → Filter → Handler → Util 흐름

역할(Role) 기반 인가 (@PreAuthorize)

Access / Refresh Token 분리

프론트엔드 Axios 인터셉터 기반 JWT 주입

웬만하면 클래스명은 바꾸지 말 것

2. 백엔드 패키지 구조 (권장 표준)
backend/src/main/java/com/{project}/
├── config/
│   └── SecurityConfig.java
│
├── security/
│   ├── exception/
│   │   └── CustomJWTException.java
│   │
│   ├── filter/
│   │   ├── JWTCheckFilter.java
│   │   └── TraceIdFilter.java
│   │
│   ├── handler/
│   │   ├── LoginSuccessHandler.java
│   │   ├── LoginFailHandler.java
│   │   └── LoginAccessDeniedHandler.java
│   │
│   ├── service/
│   │   └── UserDetailsServiceImpl.java
│   │
│   └── util/
│       ├── JWTUtil.java
│       └── CurrentUserUtil.java
│
├── controller/
│   ├── AuthController.java
│   ├── SocialLoginController.java
│   ├── TokenController.java
│   └── AdminController.java
│
├── domain/
│   └── user/
│       ├── User.java
│       ├── SystemRole.java
│       └── UserStatus.java
│
└── dto/
    └── user/
        ├── UserAuthDTO.java
        ├── UserJoinRequestDTO.java
        ├── UserResponseDTO.java
        ├── RoleChangeRequestDTO.java
        └── UserApproveRequestDTO.java

3. 핵심 클래스 책임 정의 (변경 금지)
3.1 SecurityConfig

Spring Security 전역 설정

JWT 필터 등록

CORS / CSRF 설정

인증/인가 규칙 정의

3.2 JWTCheckFilter

모든 보호 API 요청의 진입 지점

JWT 추출 위치

Authorization Header

Cookie

토큰 검증

SecurityContextHolder에 인증 정보 세팅

3.3 LoginSuccessHandler

로그인 성공 시 실행

Access / Refresh Token 발급

사용자 상태 검증

승인 여부

만료 여부

토큰을 Cookie or Header로 전달

3.4 UserDetailsServiceImpl

이메일(ID) 기반 사용자 조회

Entity → Auth DTO 변환

Spring Security 인증용 데이터 제공

3.5 JWTUtil

Token 생성

Token 검증

Claims 생성 / 파싱

만료 시간 관리

4. 프론트엔드 구조 가이드
frontend/src/
├── api/
│   ├── authApi.js
│   ├── socialApi.js
│   └── adminApi.js
│
├── components/
│   └── common/
│       ├── RequireAuth.jsx
│       └── AdminGuard.jsx
│
├── pages/
│   └── auth/
│       ├── LoginPage.jsx
│       ├── JoinPage.jsx
│       └── LogoutPage.jsx
│
├── router/
│   ├── rootRouter.jsx
│   ├── authRouter.jsx
│   └── adminRouter.jsx
│
├── store/
│   └── slices/
│       └── authSlice.js
│
├── hooks/
│   └── auth/
│       └── useAuth.js
│
└── utils/
    ├── jwtUtil.js
    └── cookieUtil.js

5. 프론트엔드 핵심 흐름
5.1 JWT 처리

Axios 인터셉터에서 Access Token 자동 주입

401 발생 시 Refresh Token으로 재발급

실패 시 로그아웃 처리

5.2 RequireAuth

로그인 여부 확인

사용자 Role 확인

접근 불가 시 리다이렉트

5.3 Redux(authSlice)

로그인 상태 전역 관리

쿠키와 상태 동기화

프로필 / Role 업데이트

6. 리팩토링 체크리스트

 SecurityConfig 분리되어 있는가

 JWT 로직이 Controller에 섞이지 않았는가

 Filter → Util → DTO 흐름이 명확한가

 인증 / 인가 책임이 섞이지 않았는가

 프론트에서 토큰 직접 조작하지 않는가

 API 접근 제어가 @PreAuthorize로 통일되어 있는가