# Postman 테스트 가이드

## 2.2 승인 요청 메일 발송 테스트

### 테스트 시나리오

#### 1단계: 업체 회원가입 (MANAGER 생성)

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/signup/organization`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "organizationName": "Care Hospital",
  "email": "manager@care.com",
  "password": "password123",
  "name": "관리자"
}
```

**예상 응답:**
- Status: `201 Created`
- Body:
```json
{
  "organizationNumber": "ABC-12345"
}
```

**Postman Tests 탭 (환경변수 저장):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("orgNumber", response.organizationNumber);
    console.log("✅ Saved orgNumber:", response.organizationNumber);
}
```

---

#### 2단계: 직원 회원가입 (승인 요청 메일 발송 확인)

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/signup/user`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "organizationNumber": "{{orgNumber}}",
  "email": "staff@care.com",
  "password": "password123",
  "name": "직원"
}
```

**예상 응답:**
- Status: `201 Created`
- Body:
```json
{
  "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
  "status": "WAITING"
}
```

**확인 사항:**
1. 애플리케이션 로그에서 승인 요청 메일 내용 확인
2. 승인 링크가 포함되어 있는지 확인
3. MANAGER 이메일로 발송되었는지 확인

**예상 로그 출력:**
```
=== 승인 요청 메일 (개발환경 - 로그 출력) ===
수신자: manager@care.com
제목: [CarePilot] 직원 승인 요청
내용:
안녕하세요,

새로운 직원이 승인을 요청했습니다.

요청자 정보:
  - 이름: 직원
  - 이메일: staff@care.com

아래 링크를 클릭하여 승인해주세요:
  http://localhost:8080/auth/approve?token=abc-123-def-456

이 링크는 24시간 동안 유효합니다.
========================================
```

**Postman Tests 탭 (승인 링크 추출 - 선택사항):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    console.log("✅ User signup successful, status:", response.status);
    // 로그에서 승인 링크를 확인해야 함
}
```

---

#### 3단계: 승인 링크 확인 (로그에서 추출)

**확인 방법:**
1. 애플리케이션 콘솔 로그 확인
2. "아래 링크를 클릭하여 승인해주세요:" 다음 줄의 URL 복사
3. 예: `http://localhost:8080/auth/approve?token=abc-123-def-456`

---

## 3.1 승인 API 테스트

### 테스트 시나리오

#### 1단계: 업체 회원가입 (MANAGER 생성)

위의 **2.2 승인 요청 메일 발송 테스트**의 1단계를 참고하여 업체 회원가입을 먼저 진행합니다.

---

#### 2단계: 직원 회원가입 (승인 토큰 생성)

위의 **2.2 승인 요청 메일 발송 테스트**의 2단계를 참고하여 직원 회원가입을 진행합니다.

**중요:** 직원 회원가입 후 애플리케이션 로그에서 승인 링크의 토큰을 복사해야 합니다.

**로그에서 토큰 추출:**
```
아래 링크를 클릭하여 승인해주세요:
  http://localhost:8080/auth/approve?token=08544516-3502-4f58-a68c-b03b3b14212e
```

위 예시에서 `08544516-3502-4f58-a68c-b03b3b14212e` 부분이 토큰입니다.

---

#### 3단계: 승인 API 호출

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/auth/approve?token={{approvalToken}}`
- Headers: 없음 (Query Parameter만 사용)

**환경변수 설정:**
Postman 환경변수에 `approvalToken`을 설정하거나, 직접 URL에 토큰을 입력합니다.

**예시:**
```
http://localhost:8080/auth/approve?token=08544516-3502-4f58-a68c-b03b3b14212e
```

**예상 응답 (성공):**
- Status: `200 OK`
- Body:
```json
{
  "message": "승인이 완료되었습니다. 이제 로그인할 수 있습니다.",
  "status": "ACTIVE",
  "email": "staff@care.com"
}
```

**Postman Tests 탭:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.test("승인 성공", function () {
        pm.expect(response.status).to.eql("ACTIVE");
        pm.expect(response.email).to.be.a("string");
    });
    console.log("✅ 승인 성공:", response.email, "→", response.status);
}
```

---

#### 4단계: 예외 케이스 테스트

##### 4-1. 유효하지 않은 토큰

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/auth/approve?token=invalid-token-12345`

**예상 응답:**
- Status: `400 Bad Request`
- Body: 없음

**Postman Tests 탭:**
```javascript
if (pm.response.code === 400) {
    pm.test("유효하지 않은 토큰 처리", function () {
        pm.expect(pm.response.code).to.eql(400);
    });
    console.log("✅ 유효하지 않은 토큰 → 400 Bad Request");
}
```

##### 4-2. 이미 승인된 사용자 재요청

**시나리오:**
1. 위의 3단계에서 승인 성공
2. 동일한 토큰으로 다시 승인 요청

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/auth/approve?token={{approvalToken}}` (이미 사용한 토큰)

**예상 응답:**
- Status: `400 Bad Request` (토큰이 이미 삭제되었거나, 이미 승인된 경우)

**참고:** 토큰은 승인 후 삭제되므로, 동일한 토큰으로 재요청하면 "유효하지 않은 토큰" 오류가 발생합니다.

---

### 테스트 체크리스트

- [ ] 업체 회원가입 성공
- [ ] 직원 회원가입 성공
- [ ] 로그에서 승인 토큰 추출
- [ ] 승인 API 호출 → 200 OK
- [ ] 응답에서 status=ACTIVE 확인
- [ ] 응답에서 email 확인
- [ ] 유효하지 않은 토큰 → 400 Bad Request
- [ ] DB에서 사용자 status가 ACTIVE로 변경되었는지 확인 (선택사항)
- [ ] DB에서 approval_processed_at이 기록되었는지 확인 (선택사항)

---

### 문제 해결

**400 Bad Request가 발생하는 경우:**
- 토큰이 올바르게 복사되었는지 확인 (공백 없이)
- 토큰이 만료되었는지 확인 (24시간 유효)
- 이미 사용된 토큰인지 확인 (승인 후 토큰은 삭제됨)

**500 Internal Server Error가 발생하는 경우:**
- 애플리케이션 로그 확인
- 사용자가 DB에 존재하는지 확인
- 이미 승인된 사용자인지 확인

---

## 2.2 승인 요청 메일 발송 테스트

### 테스트 체크리스트

- [ ] 업체 회원가입 성공
- [ ] organizationNumber 환경변수 저장 확인
- [ ] 직원 회원가입 성공
- [ ] 로그에서 승인 요청 메일 확인
- [ ] 승인 링크가 올바른 형식인지 확인 (`http://localhost:8080/auth/approve?token=xxx`)
- [ ] MANAGER 이메일이 수신자로 표시되는지 확인
- [ ] 요청자 정보(이름, 이메일)가 올바르게 표시되는지 확인

---

### 문제 해결

**로그에 승인 메일이 안 보이는 경우:**
- 로그 레벨 확인 (INFO 레벨 이상)
- 애플리케이션 재시작
- 직원 회원가입이 실제로 성공했는지 확인

**승인 링크 형식이 잘못된 경우:**
- `application.properties`의 `app.approval.base-url`, `app.approval.path` 확인

---

## 4.1 로그인 API 테스트

### 테스트 시나리오

#### 1단계: 승인 전 로그인 시도 (WAITING 상태)

**전제 조건:**
- 직원 회원가입 완료 (status=WAITING)
- 아직 승인되지 않은 상태

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "email": "staff@care.com",
  "password": "password123"
}
```

**예상 응답:**
- Status: `403 Forbidden`
- Body:
```json
{
  "timestamp": "2026-01-24T...",
  "status": 403,
  "error": "Forbidden",
  "message": "승인되지 않은 사용자입니다. 관리자 승인 후 로그인할 수 있습니다.",
  "path": "/auth/login"
}
```

**Postman Tests 탭:**
```javascript
pm.test("승인 전 로그인 차단", function () {
    pm.response.to.have.status(403);
    const response = pm.response.json();
    pm.expect(response.message).to.include("승인되지 않은 사용자");
});
console.log("✅ 승인 전 로그인 → 403 Forbidden");
```

---

#### 2단계: 승인 처리

위의 **3.1 승인 API 테스트**를 참고하여 사용자를 승인합니다.

---

#### 3단계: 승인 후 로그인 (ACTIVE 상태)

**전제 조건:**
- 사용자가 승인 완료 (status=ACTIVE)

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "email": "staff@care.com",
  "password": "password123"
}
```

**예상 응답 (성공):**
- Status: `200 OK`
- Body:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer"
}
```

**Postman Tests 탭 (토큰 저장):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    pm.test("로그인 성공", function () {
        pm.expect(response.accessToken).to.be.a("string");
        pm.expect(response.refreshToken).to.be.a("string");
        pm.expect(response.tokenType).to.eql("Bearer");
    });
    
    // 환경변수에 토큰 저장
    pm.environment.set("accessToken", response.accessToken);
    pm.environment.set("refreshToken", response.refreshToken);
    
    console.log("✅ 로그인 성공");
    console.log("  - accessToken 저장됨");
    console.log("  - refreshToken 저장됨");
}
```

---

#### 4단계: 예외 케이스 테스트

##### 4-1. 잘못된 비밀번호

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Body:
```json
{
  "email": "staff@care.com",
  "password": "wrongpassword"
}
```

**예상 응답:**
- Status: `401 Unauthorized`
- Body:
```json
{
  "timestamp": "2026-01-24T...",
  "status": 401,
  "error": "Unauthorized",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "path": "/auth/login"
}
```

**Postman Tests 탭:**
```javascript
pm.test("잘못된 비밀번호 처리", function () {
    pm.response.to.have.status(401);
    const response = pm.response.json();
    pm.expect(response.message).to.include("이메일 또는 비밀번호");
});
console.log("✅ 잘못된 비밀번호 → 401 Unauthorized");
```

##### 4-2. 존재하지 않는 이메일

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Body:
```json
{
  "email": "nonexistent@care.com",
  "password": "password123"
}
```

**예상 응답:**
- Status: `401 Unauthorized`
- Body:
```json
{
  "timestamp": "2026-01-24T...",
  "status": 401,
  "error": "Unauthorized",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "path": "/auth/login"
}
```

**Postman Tests 탭:**
```javascript
pm.test("존재하지 않는 이메일 처리", function () {
    pm.response.to.have.status(401);
    const response = pm.response.json();
    pm.expect(response.message).to.include("이메일 또는 비밀번호");
});
console.log("✅ 존재하지 않는 이메일 → 401 Unauthorized");
```

---

### 테스트 체크리스트

- [ ] 승인 전 로그인 → 403 Forbidden
- [ ] 승인 후 로그인 → 200 OK + JWT 토큰 발급
- [ ] accessToken 환경변수 저장 확인
- [ ] refreshToken 환경변수 저장 확인
- [ ] 잘못된 비밀번호 → 401 Unauthorized
- [ ] 존재하지 않는 이메일 → 401 Unauthorized
- [ ] 토큰 형식 확인 (Bearer 타입)

---

### 문제 해결

**401 Unauthorized가 발생하는 경우:**
- 이메일과 비밀번호가 올바른지 확인
- 사용자가 DB에 존재하는지 확인
- 비밀번호가 BCrypt로 암호화되어 저장되었는지 확인

**403 Forbidden이 발생하는 경우:**
- 사용자 상태가 ACTIVE인지 확인
- 승인 처리가 완료되었는지 확인

**토큰이 발급되지 않는 경우:**
- 애플리케이션 로그 확인
- JWT 설정이 올바른지 확인 (`application.properties`)

---

## 5. Spring Security 및 JWT 필터 테스트

### 테스트 시나리오

#### 5-1. `/auth/**` 엔드포인트는 토큰 없이 접근 가능

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/login`
- Headers: 없음 (토큰 없이)
- Body:
```json
{
  "email": "staff@care.com",
  "password": "password123"
}
```

**예상 응답:**
- Status: `200 OK` (토큰 없이도 접근 가능)

**Postman Tests 탭:**
```javascript
pm.test("/auth/** 엔드포인트는 토큰 없이 접근 가능", function () {
    pm.response.to.have.status(200);
});
console.log("✅ /auth/** 엔드포인트는 토큰 없이 접근 가능");
```

---

#### 5-2. 보호된 API 토큰 없이 접근 시 401

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/protected`
- Headers: 없음 (토큰 없이)

**예상 응답:**
- Status: `401 Unauthorized`
- Body:
```json
{
  "error": "ERROR_ACCESS_TOKEN"
}
```

**Postman Tests 탭:**
```javascript
pm.test("보호된 API 토큰 없이 접근 → 401", function () {
    pm.response.to.have.status(401);
    const response = pm.response.json();
    pm.expect(response.error).to.eql("ERROR_ACCESS_TOKEN");
});
console.log("✅ 보호된 API 토큰 없이 접근 → 401 Unauthorized");
```

---

#### 5-3. 유효한 토큰으로 보호된 API 접근

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/protected`
- Headers:
```
Authorization: Bearer {{accessToken}}
```

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "보호된 엔드포인트 접근 성공",
  "principal": "1",
  "authorities": ["ROLE_USER"]
}
```

**Postman Tests 탭:**
```javascript
pm.test("유효한 토큰으로 보호된 API 접근 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("보호된 엔드포인트");
});
console.log("✅ 유효한 토큰으로 보호된 API 접근 성공");
```

---

#### 5-4. 권한 부족 시 403 (USER → MANAGER API 접근)

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/manager`
- Headers:
```
Authorization: Bearer {{accessToken}}
```
(참고: `accessToken`은 USER 권한을 가진 토큰이어야 함)

**예상 응답:**
- Status: `403 Forbidden`
- Body:
```json
{
  "error": "ERROR_ACCESSDENIED"
}
```

**Postman Tests 탭:**
```javascript
pm.test("권한 부족 → 403", function () {
    pm.response.to.have.status(403);
    const response = pm.response.json();
    pm.expect(response.error).to.eql("ERROR_ACCESSDENIED");
});
console.log("✅ 권한 부족 → 403 Forbidden");
```

---

#### 5-5. MANAGER 권한으로 MANAGER API 접근

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/manager`
- Headers:
```
Authorization: Bearer {{managerAccessToken}}
```
(참고: MANAGER 권한을 가진 토큰 필요)

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "MANAGER 전용 엔드포인트 접근 성공"
}
```

**Postman Tests 탭:**
```javascript
pm.test("MANAGER 권한으로 MANAGER API 접근 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("MANAGER");
});
console.log("✅ MANAGER 권한으로 MANAGER API 접근 성공");
```

---

#### 5-6. ADMIN 권한으로 ADMIN API 접근

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/admin`
- Headers:
```
Authorization: Bearer {{adminAccessToken}}
```
(참고: ADMIN 권한을 가진 토큰 필요)

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "ADMIN 전용 엔드포인트 접근 성공"
}
```

**Postman Tests 탭:**
```javascript
pm.test("ADMIN 권한으로 ADMIN API 접근 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("ADMIN");
});
console.log("✅ ADMIN 권한으로 ADMIN API 접근 성공");
```

---

## 6. 조직 범위 제한 테스트

### 테스트 시나리오

#### 6-1. MANAGER가 자기 조직 접근 (성공)

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/organization/{{organizationId}}`
- Headers:
```
Authorization: Bearer {{managerAccessToken}}
```
(참고: `organizationId`는 MANAGER의 organizationId와 동일해야 함)

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "조직 데이터 접근 성공",
  "organizationId": 1,
  "currentUserId": 1,
  "currentRole": "MANAGER",
  "currentOrganizationId": 1
}
```

**Postman Tests 탭:**
```javascript
pm.test("MANAGER가 자기 조직 접근 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("조직 데이터 접근 성공");
    pm.expect(response.currentOrganizationId).to.eql(response.organizationId);
});
console.log("✅ MANAGER가 자기 조직 접근 성공");
```

---

#### 6-2. MANAGER가 다른 조직 접근 시도 (403)

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/organization/999`
- Headers:
```
Authorization: Bearer {{managerAccessToken}}
```
(참고: `999`는 MANAGER의 organizationId와 다른 값)

**예상 응답:**
- Status: `403 Forbidden`
- Body:
```json
{
  "error": "ERROR_ACCESSDENIED"
}
```

**Postman Tests 탭:**
```javascript
pm.test("MANAGER가 다른 조직 접근 차단", function () {
    pm.response.to.have.status(403);
    const response = pm.response.json();
    pm.expect(response.error).to.eql("ERROR_ACCESSDENIED");
});
console.log("✅ MANAGER가 다른 조직 접근 차단 → 403 Forbidden");
```

---

#### 6-3. ADMIN이 모든 조직 접근 (성공)

**요청:**
- Method: `GET`
- URL: `http://localhost:8080/test/organization/{{organizationId}}`
- Headers:
```
Authorization: Bearer {{adminAccessToken}}
```
(참고: ADMIN은 어떤 organizationId든 접근 가능)

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "조직 데이터 접근 성공",
  "organizationId": 1,
  "currentUserId": 1,
  "currentRole": "ADMIN",
  "currentOrganizationId": 1
}
```

**Postman Tests 탭:**
```javascript
pm.test("ADMIN이 모든 조직 접근 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("조직 데이터 접근 성공");
    pm.expect(response.currentRole).to.eql("ADMIN");
});
console.log("✅ ADMIN이 모든 조직 접근 성공");
```

---

### 테스트 체크리스트

- [ ] `/auth/**` 토큰 없이 접근 가능
- [ ] 보호된 API 토큰 없이 접근 → 401 Unauthorized
- [ ] 유효한 토큰으로 보호된 API 접근 → 200 OK
- [ ] 권한 부족 → 403 Forbidden
- [ ] USER → MANAGER API 접근 차단
- [ ] MANAGER → ADMIN API 접근 차단
- [ ] MANAGER 권한으로 MANAGER API 접근 성공
- [ ] ADMIN 권한으로 ADMIN API 접근 성공
- [ ] MANAGER가 자기 조직 접근 성공
- [ ] MANAGER가 다른 조직 접근 차단 → 403
- [ ] ADMIN이 모든 조직 접근 성공

---

### 문제 해결

**401 Unauthorized가 발생하는 경우:**
- Authorization 헤더에 `Bearer ` 접두사가 있는지 확인
- 토큰이 유효한지 확인 (만료되지 않았는지)
- JWT 설정이 올바른지 확인 (`application.properties`)

**403 Forbidden이 발생하는 경우:**
- 사용자의 Role이 해당 API에 접근할 권한이 있는지 확인
- `@PreAuthorize` 어노테이션이 올바르게 설정되었는지 확인

**토큰이 제대로 파싱되지 않는 경우:**
- JwtCheckFilter 로그 확인
- SecurityContext에 인증 정보가 설정되었는지 확인

---

## 8. 로그아웃 테스트

### 테스트 시나리오

#### 8-1. 로그아웃 API 호출

**요청:**
- Method: `POST`
- URL: `http://localhost:8080/auth/logout`
- Headers:
```
Authorization: Bearer {{accessToken}}
```

**예상 응답:**
- Status: `200 OK`
- Body:
```json
{
  "message": "로그아웃되었습니다."
}
```

**Postman Tests 탭:**
```javascript
pm.test("로그아웃 성공", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.message).to.include("로그아웃");
});
console.log("✅ 로그아웃 성공");
```

---

#### 8-2. 로그아웃 후 토큰 삭제 및 보호 API 접근 테스트

**1단계: 로그아웃**
- 위의 8-1 단계 수행

**2단계: 토큰 삭제 (Postman 환경변수에서)**
- Postman에서 `accessToken` 환경변수 삭제 또는 빈 값으로 설정

**3단계: 보호된 API 접근 시도**
- Method: `GET`
- URL: `http://localhost:8080/test/protected`
- Headers: 없음 (토큰 없이)

**예상 응답:**
- Status: `401 Unauthorized`
- Body:
```json
{
  "error": "ERROR_ACCESS_TOKEN"
}
```

**Postman Tests 탭:**
```javascript
pm.test("로그아웃 후 보호 API 접근 차단", function () {
    pm.response.to.have.status(401);
    const response = pm.response.json();
    pm.expect(response.error).to.eql("ERROR_ACCESS_TOKEN");
});
console.log("✅ 로그아웃 후 보호 API 접근 차단 → 401 Unauthorized");
```

---

### 테스트 체크리스트

- [ ] 로그아웃 API 호출 → 200 OK
- [ ] 로그아웃 응답 메시지 확인
- [ ] 토큰 삭제 후 보호 API 접근 → 401 Unauthorized

---

### 문제 해결

**로그아웃이 실패하는 경우:**
- Authorization 헤더에 유효한 토큰이 있는지 확인
- 토큰이 만료되지 않았는지 확인

**로그아웃 후에도 API 접근이 되는 경우:**
- 프론트엔드에서 토큰이 제대로 삭제되었는지 확인
- 브라우저의 로컬 스토리지/세션 스토리지 확인

---

## 7. 카카오 소셜 로그인 테스트

### 7.1 테스트 전 준비사항

**참고:** 실제 카카오 OAuth2 인증 플로우는 브라우저에서 카카오 인증을 거쳐야 하므로, Postman으로는 추가 정보 입력 API만 테스트할 수 있습니다.

**테스트 시나리오:**
1. 업체 회원가입으로 MANAGER 생성 (이미 완료했다면 생략)
2. ADMIN 소셜 회원가입 테스트
3. USER 소셜 회원가입 테스트 (승인 메일 발송 확인)

---

### 7.2 ADMIN 소셜 회원가입

**엔드포인트:** `POST /auth/oauth2/signup/admin`

**설명:** ADMIN은 소셜 회원가입 시 즉시 ACTIVE 상태가 되고 JWT 토큰을 발급받습니다.

#### 요청

**Method:** `POST`

**URL:** `http://localhost:8080/auth/oauth2/signup/admin`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@kakao.com",
  "name": "카카오 관리자"
}
```

#### 예상 응답

**성공 (201 Created):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "requiresAdditionalInfo": false,
  "message": null,
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

**실패 (400 Bad Request):**
- 이메일 중복 시

#### 테스트 체크리스트

- [ ] ADMIN 소셜 회원가입 성공
- [ ] JWT 토큰 발급 확인
- [ ] status = ACTIVE 확인
- [ ] 발급받은 accessToken으로 보호 API 접근 테스트

---

### 7.3 USER 소셜 회원가입

**엔드포인트:** `POST /auth/oauth2/signup/user`

**설명:** USER는 소셜 회원가입 시 organization_number를 입력해야 하며, WAITING 상태가 됩니다. 해당 조직의 MANAGER에게 승인 메일이 발송됩니다.

#### 요청

**Method:** `POST`

**URL:** `http://localhost:8080/auth/oauth2/signup/user`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@kakao.com",
  "name": "카카오 직원",
  "organizationNumber": "ABC-12345"
}
```

**참고:** `organizationNumber`는 먼저 업체 회원가입으로 생성된 조직 번호를 사용해야 합니다.

#### 예상 응답

**성공 (201 Created):**
```json
{
  "success": false,
  "accessToken": null,
  "refreshToken": null,
  "tokenType": null,
  "requiresAdditionalInfo": false,
  "message": "승인 대기 중입니다. 관리자 승인 후 로그인할 수 있습니다.",
  "role": null,
  "status": "WAITING"
}
```

**실패 (400 Bad Request):**
- 이메일 중복 시
- 존재하지 않는 organization_number 입력 시

#### 테스트 체크리스트

- [ ] USER 소셜 회원가입 성공
- [ ] status = WAITING 확인
- [ ] 서버 로그에서 승인 메일 발송 확인
- [ ] 승인 링크로 승인 처리 테스트 (`GET /auth/approve?token=xxx`)
- [ ] 승인 후 로그인 가능한지 확인

---

### 7.4 실제 카카오 OAuth2 플로우 테스트 (브라우저)

**참고:** 실제 카카오 인증은 브라우저에서 테스트해야 합니다.

#### 테스트 방법

1. **카카오 로그인 URL 접속:**
   ```
   http://localhost:8080/oauth2/authorization/kakao
   ```

2. **카카오 인증 완료 후:**
   - 백엔드가 `/login/oauth2/code/kakao`로 리다이렉트
   - `OAuth2SuccessHandler`가 JSON 응답 반환

3. **응답 확인:**
   - 기존 사용자 (ACTIVE): JWT 토큰 발급
   - 기존 사용자 (WAITING): 승인 대기 메시지
   - 신규 사용자: `requiresAdditionalInfo = true`

4. **신규 사용자 추가 정보 입력:**
   - 프론트엔드에서 Role 선택
   - USER 선택 시 organization_number 입력
   - `POST /auth/oauth2/signup/admin` 또는 `POST /auth/oauth2/signup/user` 호출

---

### 7.5 테스트 시나리오

#### 시나리오 1: ADMIN 소셜 회원가입 → 즉시 로그인

1. `POST /auth/oauth2/signup/admin` 호출
2. JWT 토큰 발급 확인
3. 발급받은 토큰으로 보호 API 접근 테스트

#### 시나리오 2: USER 소셜 회원가입 → 승인 대기 → 승인 → 로그인

1. 업체 회원가입으로 MANAGER 생성 (organization_number: `ABC-12345`)
2. `POST /auth/oauth2/signup/user` 호출 (organization_number: `ABC-12345`)
3. 서버 로그에서 승인 메일 발송 확인
4. 승인 링크로 승인 처리 (`GET /auth/approve?token=xxx`)
5. 일반 로그인 API로 로그인 테스트 (`POST /auth/login`)

---

### 문제 해결

**승인 메일이 발송되지 않는 경우:**
- 조직에 MANAGER가 있는지 확인
- 서버 로그에서 "조직에 MANAGER가 없음" 경고 확인
- `organization_number`가 올바른지 확인

**소셜 회원가입 후 로그인이 안 되는 경우:**
- USER는 승인 후에만 로그인 가능 (status = ACTIVE)
- ADMIN은 즉시 로그인 가능
- 일반 로그인 API는 password가 필요하므로 소셜 로그인 사용자는 카카오 인증 플로우를 사용해야 함

