# CarePilot 인증 / 권한 구현 TODO

본 문서는 CarePilot 프로젝트의  
**업체/직원 회원가입 + 승인 + JWT 인증/권한** 구현을 위한 단계별 TODO 리스트다.  
ERD 및 PRD 기준으로 작성되었으며, 각 단계마다 **코드 테스트 + Postman 테스트**를 병행한다.

---

## 0. 사전 준비

### 공통 설정

- [x] Role ENUM 정의
  - ADMIN, MANAGER, USER
- [x] Status ENUM 정의
  - WAITING, ACTIVE, DENIED, DISABLED
- [x] BCrypt PasswordEncoder Bean 등록
- [ ] 공통 에러 응답 포맷 정의 (code, message, timestamp)

### 테스트

- [ ] PasswordEncoder encode / match 단위 테스트

---

## 1. Organization (업체 회원가입)

### 1.1 organization_number 생성

- [x] OrganizationCodeGenerator 구현
- [x] 코드 형식: `ABC-12345`
- [x] DB UNIQUE 충돌 시 재생성 로직

#### 테스트 (코드)

- [ ] 코드 형식 정규식 테스트
- [ ] 중복 발생 시 재시도 테스트

---

### 1.2 업체 회원가입 API

- [x] POST `/auth/signup/organization`
- [x] organization 생성
- [x] MANAGER 사용자 생성
  - role = MANAGER
  - status = ACTIVE
  - organization_id 연결
- [x] 트랜잭션 처리

#### 테스트 (코드)

- [ ] 업체 + MANAGER 동시 생성 통합 테스트
- [ ] 이메일 중복 시 예외 테스트

#### Postman

- [x] 업체 회원가입 호출
- [x] 응답의 organizationNumber를 환경변수 `orgNumber`로 저장

---

## 2. 직원 회원가입 (USER)

### 2.1 직원 회원가입 API

- [x] POST `/auth/signup/user`
- [x] organization_number 존재 검증
- [x] USER 생성
  - role = USER
  - status = WAITING
  - approval_requested_at 기록
  - organization_id 연결

#### 테스트 (코드)

- [ ] 정상 organization_number → USER 생성 + WAITING 확인
- [ ] 잘못된 organization_number → INVALID_ORGANIZATION_CODE

#### Postman

- [x] 직원 회원가입 성공
- [x] 잘못된 orgNumber 테스트

---

### 2.2 승인 요청 메일 발송

- [x] 조직 MANAGER 이메일 조회
- [x] 승인 토큰 생성
- [x] 승인 링크 생성
- [x] 이메일 발송 (개발환경: 로그 출력 허용)

#### 테스트 (코드)

- [x] 승인 토큰 생성/만료 테스트
- [x] 메일 내용에 승인 링크 포함 테스트

---

## 3. 승인 처리

### 3.1 승인 API

- [x] GET `/auth/approve?token=xxx`
- [x] 토큰 검증
- [x] 승인 대상 USER 조회
- [x] status → ACTIVE
- [x] approval_processed_at 기록
- [x] approved_by 기록

#### 테스트 (코드)

- [ ] 승인 성공 테스트
- [ ] 만료 토큰 테스트
- [ ] 이미 승인된 유저 재요청 테스트

#### Postman

- [x] 승인 링크 호출 → 승인 성공 확인

---

## 4. 로그인 / JWT

### 4.1 로그인 API

- [x] POST `/auth/login`
- [x] BCrypt 검증
- [x] status 검사
  - ACTIVE → 로그인 허용
  - 그 외 → 403 NOT_APPROVED

#### 테스트 (코드)

- [ ] ACTIVE 로그인 성공
- [ ] WAITING 로그인 차단
- [ ] 비밀번호 오류 테스트

#### Postman

- [x] 승인 전 로그인 → 403
- [x] 승인 후 로그인 → 토큰 발급
- [x] accessToken 환경변수 저장

---

### 4.2 JWT 유틸

- [x] Access Token (60분)
- [x] Refresh Token (24시간)
- [x] Claim 포함
  - userId, role, organizationId, status

#### 테스트 (코드)

- [ ] 토큰 생성/검증
- [ ] 만료 토큰
- [ ] 변조 토큰

---

## 5. Spring Security 설정

### 5.1 SecurityConfig

- [x] Stateless 설정
- [x] CSRF disable
- [x] CORS 설정
- [x] permitAll: `/auth/**`

#### 테스트

- [x] `/auth/**` 토큰 없이 접근 가능
- [x] 보호 API 토큰 없이 접근 시 401

---

### 5.2 Filter / Handler

- [x] JWTCheckFilter
- [x] AuthenticationEntryPoint (401)
- [x] AccessDeniedHandler (403)

#### 테스트

- [x] 토큰 없음 → 401
- [x] 권한 부족 → 403

---

## 6. 권한 (Authorization)

### 6.1 Role 기반 제어

- [x] ADMIN 전용 API
- [x] MANAGER 전용 API
- [x] USER 접근 제한 API

#### 테스트

- [ ] USER → MANAGER API 접근 차단
- [ ] MANAGER → ADMIN API 접근 차단

---

### 6.2 조직 범위 제한

- [x] MANAGER는 자기 organization_id만 관리 가능
- [x] 다른 조직 접근 시 403
- [x] SecurityUtil 유틸리티 구현

#### 테스트

- [ ] 타 조직 직원 관리 시도 → 403

---

## 7. 카카오 소셜 로그인

### 7.1 OAuth 연동

- [x] 카카오 인증
- [x] email 수집
- [x] OAuth2SuccessHandler 구현
- [x] OAuth2Service 구현

### 7.2 Role별 처리

- [x] USER
  - organization_number 입력
  - status = WAITING
  - 승인 필요
- [x] ADMIN
  - 즉시 ACTIVE
- [x] MANAGER
  - 소셜 로그인 불가

#### 테스트

- [ ] USER 소셜 가입 → WAITING
- [ ] ADMIN 소셜 가입 → ACTIVE

---

## 8. 로그아웃 (MVP)

- [x] 로그아웃 API (`POST /auth/logout`)
- [x] 프론트 토큰 삭제 (클라이언트 측 처리)
- [x] 서버 Stateless 유지

#### 테스트

- [ ] 로그아웃 API 호출 → 200 OK
- [ ] 토큰 삭제 후 보호 API 접근 → 401

---

## 9. 테스트/운영 정리

- [ ] 테스트 DB(H2 or Testcontainers) 선택
- [ ] Postman Collection 정리
- [ ] README에 인증 흐름 요약 추가

---

## 구현 권장 순서

1. 업체 회원가입
2. 직원 회원가입
3. 승인 처리
4. 로그인/JWT
5. Security Filter
6. 권한/조직 검증
7. 소셜 로그인
