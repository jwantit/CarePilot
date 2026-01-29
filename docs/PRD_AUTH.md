# PRD – CarePilot 인증 · 권한 · 승인 시스템

---

## 1. 개요

### 1.1 목적

CarePilot은 **업체(organization) 단위로 운영되는 의료 관리 시스템**이다.  
본 PRD는 다음을 목표로 한다.

- 업체 / 직원 **분리 회원가입 구조**
- 조직 코드 기반 사용자 소속 관리
- MANAGER 승인 기반 접근 제어
- JWT 기반 Stateless 인증
- 역할(Role) 기반 권한 통제

---

## 2. 핵심 설계 원칙

### 2.1 회원가입 진입점 분리

회원가입은 반드시 **두 경로**로 분리된다.

1. **업체 회원가입** → MANAGER 생성 + 업체코드 발급
2. **직원 회원가입** → 업체코드 입력 + MANAGER 승인 필요

---

## 3. 역할(Role) 및 상태(Status) 정의

_(ERD ENUM 기준)_

### 3.1 Role

| Role    | 설명          | 접근 범위               |
| ------- | ------------- | ----------------------- |
| ADMIN   | 서비스 운영자 | 전체 시스템             |
| MANAGER | 업체 관리자   | 자기 업체 + 자기 직원만 |
| USER    | 일반 직원     | 자기 업체 업무          |

---

### 3.2 Status

| Status   | 의미                    |
| -------- | ----------------------- |
| WAITING  | 승인 대기               |
| ACTIVE   | 승인 완료 (로그인 가능) |
| DENIED   | 승인 거절               |
| DISABLED | 비활성 / 차단           |

- ❌ `isApproved` 없음
- ✅ `users.status` 로만 승인 상태 관리

---

## 4. 회원가입 / 승인 / 로그인 시퀀스 다이어그램

### 4.1 업체 회원가입 (MANAGER)

User
└─ 업체 회원가입 요청
└─ organization 생성
└─ organization_number 발급 (ABC-12345)
└─ users 생성 (role=MANAGER, status=ACTIVE)
└─ 로그인 가능

yaml
코드 복사

---

### 4.2 직원 회원가입 (USER)

User
└─ 직원 회원가입 요청 (organization_number 입력)
└─ users 생성 (role=USER, status=WAITING)
└─ approval_requested_at 기록
└─ MANAGER에게 승인 메일 발송

yaml
코드 복사

---

### 4.3 승인 처리 (MANAGER)

MANAGER
└─ 승인 메일 링크 클릭
└─ users.status = ACTIVE
└─ approval_processed_at 기록
└─ approved_by 기록

yaml
코드 복사

---

### 4.4 로그인

User
└─ 로그인 요청
├─ status == ACTIVE → JWT 발급
└─ status != ACTIVE → 403 NOT_APPROVED

markdown
코드 복사

---

## 5. 기능 요구사항 (FR)

### 5.1 업체 회원가입

- **입력값 (MVP)**
  - `organization.name`
- **자동 생성**
  - `organization_number` (예: `ABC-12345`, UNIQUE)
- **생성 결과**
  - MANAGER 계정 생성
  - `status = ACTIVE`

---

### 5.2 직원 회원가입

- **필수 입력**
  - `email`, `password`, `name`
  - `organization_number`
- **초기 상태**
  - `status = WAITING`
- **승인 주체**
  - 해당 organization의 MANAGER

---

### 5.3 승인

- **방식**: 이메일 링크 클릭
- **승인 결과**
  - `status = ACTIVE`
  - `approved_by` 기록

---

### 5.4 로그인 / 로그아웃

- **로그인 조건**
  - `status == ACTIVE`
- **로그아웃 (MVP)**
  - 프론트 토큰 삭제
  - 서버 Stateless 유지

---

## 6. Spring Security 구조 설계

### 6.1 전체 구조

Client
└─ Login API
└─ UsernamePasswordAuthenticationFilter
└─ UserDetailsService
└─ status 검사
├─ ACTIVE → SuccessHandler
└─ else → FailHandler

API Request
└─ JWTCheckFilter
└─ 토큰 검증
└─ SecurityContext 설정
└─ Controller (@PreAuthorize)

yaml
코드 복사

---

### 6.2 주요 컴포넌트

#### SecurityConfig

- Stateless 설정
- CORS 설정
- JWTCheckFilter 등록

#### UserDetailsService

- email 기준 사용자 조회
- role, status 로드

#### LoginSuccessHandler

- JWT Access / Refresh 발급
- JSON 응답

#### LoginFailHandler

- BAD_CREDENTIALS
- NOT_APPROVED

#### JWTCheckFilter

- Authorization Header 기반 토큰 추출
- 검증 실패 시 401 반환

#### AccessDeniedHandler

- 권한 부족 시 403 반환

---

### 6.3 권한식 기준

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasRole('MANAGER')")
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
MANAGER는 organization_id 기준 추가 검증 필요

7. API 명세서
7.1 업체 회원가입
POST /auth/signup/organization

json
코드 복사
{
  "organizationName": "Care Hospital",
  "email": "manager@care.com",
  "password": "****",
  "name": "관리자"
}
Response

json
코드 복사
{
  "organizationNumber": "ABC-12345"
}
7.2 직원 회원가입
POST /auth/signup/user

json
코드 복사
{
  "organizationNumber": "ABC-12345",
  "email": "staff@care.com",
  "password": "****",
  "name": "직원"
}
7.3 로그인
POST /auth/login

json
코드 복사
{
  "email": "staff@care.com",
  "password": "****"
}
Success

json
코드 복사
{
  "accessToken": "...",
  "refreshToken": "...",
  "role": "USER"
}
Fail

403 NOT_APPROVED

7.4 승인 처리
GET /auth/approve?token=xxx

승인 성공 시 status → ACTIVE

8. 카카오 소셜 로그인
대상

USER, ADMIN

USER

organization_number 추가 입력

승인 필요

ADMIN

즉시 ACTIVE

9. 에러 코드
상황	HTTP	코드
자격 오류	401	BAD_CREDENTIALS
승인 전	403	NOT_APPROVED
토큰 오류	401	ERROR_ACCESS_TOKEN
권한 없음	403	ERROR_ACCESSDENIED

10. ERD 기반 데이터 요약
organization
organization_id

name

organization_number (ABC-12345)

users
user_id

email

role (ADMIN, MANAGER, USER)

status (WAITING, ACTIVE, DENIED, DISABLED)

organization_id

approved_by

approval_requested_at

approval_processed_at

11. Backlog
재신청 제한

Refresh Token Redis 관리

다중 MANAGER

감사 로그
```
