<img src="./frontend/public/logoV1.png" width="100" alt="배포">

# Carepilot

## 📂 프로젝트 소개

AI 자동 통화를 통해 케어 대상자의 상태를 수집하고
위험 신호를 분석·감지하는 지능형 케어 모니터링 플랫폼

## 🔹기획 배경

### 1. 케어 수요의 구조적 증가

고령 인구 및 케어 대상자 급증: 인구 구조 변화로 인해 돌봄이 필요한 대상자가 지속적으로 증가하고 있습니다.

관리 방식의 한계: 기존의 인력 중심 수동 관리 방식으로는 늘어나는 수요를 감당하기에 물리적 한계에 봉착했습니다.

### 2. 전화 기반 케어 운영의 한계

운영 효율 저하: 현재 의료기관의 케어 운영은 여전히 전화 통화에 의존하고 있어 업무 부하가 높습니다.

확장성 제한: 모니터링 인원 증가 시 비례하여 운영 리소스가 급증하므로 대규모 대상자 관리가 어렵습니다.

### 3. 비정형 데이터 중심 관리 구조

데이터 활용 부재: 중요한 케어 정보가 포함된 통화 내용이 단순 음성 데이터(비정형) 상태로 방치되고 있습니다.

위험 감지 지연: 누적된 데이터를 정량적으로 분석하기 어려워, 케어 대상자의 위험 신호(Risk Sign)를 사전에 포착하거나 체계적으로 대응하는 데 제약이 있습니다.

## 📂개발 기간

**2026.01.21(수) — 2026.02.23(월)** (총 34일)

## 📂팀원

| <a href="https://github.com/junhwan0427"><img src="https://github.com/junhwan0427.png" width="100px;" alt=""/><br /><b>조준환</b><br />팀장</a> | <a href="https://github.com/jwantit"><img src="https://github.com/jwantit.png" width="100px;" alt=""/><br /><b>김지원</b><br />팀원</a> | <a href="https://github.com/JeonHaSung"><img src="https://github.com/JeonHaSung.png" width="100px;" alt=""/><br /><b>전하성</b><br />팀원</a> | <a href="https://github.com/leegh063"><img src="https://github.com/leegh063.png" width="100px;" alt=""/><br /><b>이건호</b><br />팀원</a> |
| :---------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: |

### 조준환 (팀장)

**[Front-end]**

-ㅇ

**[Back-end]**

-ㅇ

### 김지원 (팀원)

**[Front-end]**

-ㅇ

**[Back-end]**

-ㅇ

### 전하성 (팀원)

**[Front-end]**

-ㅇ

**[Back-end]**

-ㅇ

### 이건호 (팀원)

**[Front-end]**

-ㅇ

**[Back-end]**

-ㅇ

## 📂주요 기능

- **로그인 및 회원가입** - JWT 인증 및 카카오 소셜 로그인
- **직원 관리** - 가입 승인 및 권한 관리
- **대시보드** - 오늘의 일정, 즉시 조치 필요한 알림, 미처리 업무 현황
- **케어 대상자 관리** - 모니터링할 케어 대상자 CRUD + CSV/EXCEL 대량 등록
- **케어 그룹 관리** - 유사성이 같은 대상자들을 그룹별로 관리하여 모니터링
- **통화** - (그룹/개인) 통화 스케줄 예약 및 자동화
  - Call(STT 음성인식 + Twilio) - 음성인식을 통해 대상자의 상태 확인
  - AI 분석(LLM) - 실시간 긴급상태 감지, 위험도 산정, 다음 예약 변경 자동화
  - SMS(Twilio) - 문자 수발신 예약 수정 / 처방전 / 알림
- **작업** - 할일 목록 / AI 처리 작업 대기
- **알림** - 통화 실시간 긴급 알림 / 위험도
- **공지사항** - 대댓글 및 파일 첨부 기능
- **반응형 UI** - PC / 태블릿 / 모바일
- **AI 챗봇** - 대상자 정보 조회 / 예약 등록 / 공지사항 등록

## 📂 사용 스택

🖥️ **Front-end**  
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-671AEF?style=for-the-badge&logo=axios&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![StompJS](https://img.shields.io/badge/StompJS-4E4E4E?style=for-the-badge)
![React Hot Toast](https://img.shields.io/badge/React_Hot_Toast-FF6B6B?style=for-the-badge&logo=react-hot-toast&logoColor=white)

🗄️ **Back-end**  
![Spring Boot 3.5.9](https://img.shields.io/badge/Spring_Boot-3.5.9-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-4E4E4E?style=for-the-badge)
![Spring Mail](https://img.shields.io/badge/Spring_Mail-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Apache POI](https://img.shields.io/badge/Apache_POI-D22128?style=for-the-badge)
![ModelMapper](https://img.shields.io/badge/ModelMapper-4E4E4E?style=for-the-badge)

🤖 **AI/ML**  
![SpringAI 1.0.0-M6](https://img.shields.io/badge/SpringAI-1.0.0--M6-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-FFCD00?style=for-the-badge&logo=openai&logoColor=black)
![Ollama](https://img.shields.io/badge/Ollama-FFCD00?style=for-the-badge&logo=ollama&logoColor=black)
![RedisStack](https://img.shields.io/badge/RedisStack-FFCD00?style=for-the-badge&logo=redis&logoColor=black)
![bge-m3](https://img.shields.io/badge/bge-m3-FFCD00?style=for-the-badge&logo=bge-m3&logoColor=black)
![Qwen3:8b](https://img.shields.io/badge/Qwen3:8b-FFCD00?style=for-the-badge&logo=qwen3:8b&logoColor=black)

🗺️ **API**  
![Kakao](https://img.shields.io/badge/Kakao-FFCD00?style=for-the-badge&logo=kakao&logoColor=black)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)

---

## 📂 배포 파이프라인 아키텍처

### AWS Cloud Ecosystem
- **IAM** - 엄격한 권한 관리 및 보안 정책 적용
- **EC2** - 확장 가능한 서버 환경 구축

### Elastic Beanstalk
- 애플리케이션 환경 관리 및 배포 프로세스 표준화
- 자동 스케일링 및 환경 구성 관리

### Database Management
- **RDS(MySQL)** - 데이터 독립성 확보 및 고가용성 제공
- **Security Group** - 네트워크 레벨 접근 제어를 통한 보안 강화

### Nginx Reverse Proxy
- 리버스 프록시 설정을 통한 로드 밸런싱
- 서비스 중단 없는 무중단 배포 환경 구현

### CI/CD Automation
- **Jenkins** - 코드 통합 및 빌드 자동화
- **Elastic Beanstalk 연동** - 코드 통합부터 실행까지 전 과정 자동화


![배포](./img/배포.png)
---


---

## 📂ERD & 유스케이스

### 🔹ERD

![ERD](./img/erd.jpg)

### 🔹유스케이스 다이어그램

![유스케이스](./img/유스케이스.jpg)

## 📂기능 소개

#### 시연영상 보러가기
[![YouTube Badge](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=CI3Fi-axLiY)

### 🔹 로그인 및 회원가입 (소셜 로그인)

- JWT를 이용한 보안 처리 및 Spring Security 활용
- 카카오 소셜 로그인
- httpOnly 쿠키 기반 토큰 관리

```java
// 카카오 소셜 로그인 처리
public OAuth2LoginResponseDTO processKakaoLogin(String email, String name) {
    User user = userRepository.findByEmail(email).orElse(null);
    if (user != null) return authService.generateTokens(user); // 기존 회원 로그인
    return OAuth2LoginResponseDTO.requiresAdditionalInfo(email, name); // 신규 회원 가입 필요
}
```
![로그인](./img/login.gif)

---

### 🔹 직원 관리

- 가입 승인 및 권한 관리
- 역할 기반 접근 제어 (ADMIN, MANAGER, USER)
- 조직별 사용자 관리
- 승인 대기 사용자 관리 및 이메일 알림

---

### 🔹 대시보드

- 오늘의 일정 - 오늘 날짜의 통화 스케줄 조회 및 상태 표시
- 즉시 조치 필요한 알림 - 긴급 알림(CRITICAL, HIGH) 및 위험도 높은 대상자 표시
- 미처리 업무 현황 - 대기 중인 작업 및 진행 중인 작업 통계
- 통화 통계 - 통화 완료율, 실패율 등 시각화
- 위험도 통계 - 조직 내 대상자 위험도 분포
- 최근 활동 - 최근 알림 및 작업 내역

```java
// 대시보드 통계 API
@GetMapping("/{orgId}/stats")
public ResponseEntity<Map<String, Object>> getDashboardStats(@PathVariable Long orgId) {
    return ResponseEntity.ok(Map.of(
        "callStats", dashboardService.getCallStats(orgId),
        "riskStats", dashboardService.getRiskStats(orgId),
        "taskStats", dashboardService.getTaskStats(orgId)
    ));
}
```

![대시보드](./img/dashboard.gif)

---

### 🔹 통계

- **대상자 및 그룹별 상세 리포트 제공**
- **위험도 분석** - 전체/그룹별 위험도 분포 및 추이 시각화
- **통화 분석** - 통화 성공률, 응답 시간 등 통화 품질 지표 확인
- **AI 자동화** - AI가 수행한 자동 조치 비율 및 성과 분석
- **PDF 내보내기** - 보고서 PDF 다운로드 기능

```java
// 통계 데이터 조회 (기간, 그룹, 질환 필터링)
public Map<String, Object> getStatistics(String start, String end, Long groupId, String disease) {
    return Map.of(
        "summary", reportService.getSummary(start, end, groupId, disease),
        "riskAnalysis", reportService.getRiskAnalysis(start, end, groupId, disease),
        "callAnalysis", reportService.getCallAnalysis(start, end, groupId, disease),
        "aiAutomation", reportService.getAiAutomationStats(start, end, groupId, disease)
    );
}
```
![작업](./img/statistics.gif)
---

### 🔹 작업

- **할일 목록 (자동화 OFF)**
  - **통화/SMS 예약 변경** - 통화 및 SMS에서 감지된 예약 변경 요청이 대기 목록에 추가되며, '시작' 버튼으로 승인 시 자동 처리
  - **AI 챗봇 요청** - 챗봇을 통해 접수된 작업이 대기 목록에 추가되며, '시작' 버튼으로 승인 시 자동 처리
- **AI 처리 이력** - AI가 수행한 모든 자동 및 수동 처리 내역 관리 

```java
// AI 챗봇 자동화 작업 분류 및 처리
private void processChatbotAutomation(Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow();
    if (task.getType() == TaskType.SCHEDULE_CHANGE) {
        scheduleService.updateReservation(task.getData()); // 예약 변경 자동 처리
    } else if (task.getType() == TaskType.NOTICE_CREATE) {
        noticeService.createNotice(task.getData()); // 공지사항 등록
    }
}
```

![작업](./img/work.gif)

---

### 🔹 알림

- 통화 실시간 긴급 알림 - 통화 중 긴급 상황 감지 시 즉시 알림
- 위험도 알림 - 대상자 위험도 변화 시 알림
- 알림 심각도 분류 - CRITICAL, HIGH, MEDIUM, LOW
- 알림 읽음/미읽음 상태 관리
- 조직별 알림 필터링

![알림](./img/alarm.gif)
![알림](./img/alarmimg.png)

---

### 🔹 AI 챗봇

- 대상자 정보 조회 - 자연어로 케어 대상자 정보 검색 및 조회
- 예약 등록 - 통화 스케줄 예약 자동화 (일회성/반복 예약 지원)
- 공지사항 등록 - 챗봇을 통한 공지사항 작성 요청 및 자동화
- RAG 기반 컨텍스트 검색 - RedisStack 벡터 검색을 통한 관련 정보 제공
- SpringAI 기반 LLM 통합 - OpenAI 및 Ollama 모델 지원

```java
// RAG 기반 AI 챗봇 응답 생성
public String generateAiResponse(String userMessage) {
    List<Document> context = vectorSearchService.search(userMessage); // RAG 검색
    return chatClient.prompt()
        .system(systemPrompt)
        .user(userMessage)
        .call().content(); // LLM 응답 생성
}
```

![챗봇](./img/chatbot.gif)

---
## 🔹 케어 대상자 관리

조직별 맞춤형 케어 대상자 관리와 CSV 기반 일괄 데이터 처리 기능을 제공

- CSV/EXCEL 업로드로 대상자 대량 등록

```java
// CSV 대량 등록 처리
public void uploadCareTargets(MultipartFile file) {
    List<CareTargetDTO> targets = csvParser.parse(file, CareTargetDTO.class);
    careTargetRepository.saveAll(targets.stream().map(DTO::toEntity).toList());
}
```

![대상자 관리 시연](./img/careTarget.gif)

### 대상자 상세보기

- 대상자 프로필 등록(대상자 수정)
- 위험도 추이 - 통화 후 LLM이 대상자의 위험도 스코어를 제공하며, 해당 데이터를 기반으로 주별로 시각화하여 제공
- 통화 이력
- 처방 이력

```java
// 프로필 이미지 업로드
public void updateProfileImage(Long targetId, MultipartFile file) {
    String imageUrl = s3Service.upload(file);
    careTargetRepository.findById(targetId).ifPresent(t -> t.updateImage(imageUrl));
}
```

![대상자 상세보기](./img/careTargetDetail.gif)

## 🔹 케어 그룹

유사성이 같은 대상자들을 그룹별로 관리하여 모니터링할 수 있는 기능을 제공합니다.

- 그룹 생성 및 관리
- 그룹별 통화 스케줄 관리

```java
// 케어 그룹 생성
public void createGroup(GroupDTO dto) {
    careGroupRepository.save(CareGroup.builder()
        .name(dto.getName())
        .description(dto.getDescription())
        .build());
}
```

![대상자 그룹 시연](./img/group.gif)

## 🔹 공지사항

- 공지 등록 및 댓글 작성
- 대댓글 기능
- 이미지 업로드 및 파일 관리

```java
// 공지사항 등록 및 파일 첨부
public void createNotice(NoticeDTO dto, List<MultipartFile> files) {
    Notice notice = noticeRepository.save(dto.toEntity());
    if (files != null) fileService.uploadFiles(notice.getId(), files);
}
```

![게시판 등록](./img/board.gif)
![대댓글](./img/comment.gif)

## 🔹 설정

- **시나리오 관리(CRUD)** - 통화 연결 시 대상자에게 전달될 질문지 관리
- **위험 설정** - LLM이 산출한 위험 점수가 미리 설정한 임계값(Threshold)을 초과할 경우, 해당 등급(긴급, 위험, 보통, 낮음)으로 자동 분류
- **알림 설정 ON/OFF**
  - SMS 알림 - 긴급 상황 시 SMS(문자)로 알림
  - 이메일 알림 - 직원 회원가입 요청 시 승인 이메일 발송
  - 위험 감지 - 케어 대상자 위험 감지 알림
  - 통화 실패 - 정기 통화 실패 시 알림
  - 긴급 상황 - 긴급 상황 시 즉시 알림 (통화 중 긴급 상황인 경우 실시간 긴급 알림)
- **AI 설정** - 챗봇 자동화, LLM 모델 선택 등
- **의료진 관리**

```java
// 시나리오 질문지 생성
public void createScenario(ScenarioDTO dto) {
    scenarioRepository.save(dto.toEntity());
}

// 위험도 임계값 설정
public void updateRiskConfig(RiskConfigDTO dto) {
    riskConfigService.updateThresholds(dto);
}
```

![설정 시나리오](./img/scenario.gif)

## 🔹 통화

- **통화 스케줄** - 개인/그룹 스케줄 등록 (일회성/반복 예약 지원)
- **통화 이력** - 통화 전문, AI 요약, 녹취 파일
- **자동 통화 실행** - Twilio + STT 음성 인식을 통한 대상자 상태 확인
- **AI 분석** - 실시간 긴급 상태 감지, 위험도 산정, 다음 예약 변경 자동화
- **SMS 발송** - 예약 수정, 처방전, 알림 문자 발송

**자동화 프로세스**
- 스케줄 기반 자동 통화 실행 → 시나리오 질문 자동 진행 → STT 음성 인식으로 응답 수집
- 실시간 긴급 상태 감지 (LLM 기반) → 위험도 산정 및 알림 생성 → 다음 예약 자동 변경

```java
// 통화 스케줄 등록
public void createSchedule(ScheduleDTO dto) {
    scheduleRepository.save(dto.toEntity());
}

// 통화 중 실시간 긴급상황 감지
public boolean detectEmergency(String response) {
    return aiClient.analyzeRisk(response).isEmergency();
}
```

![예약](./img/call.gif)

## 🔹 반응형 UI

- PC / 태블릿 / 모바일 지원
- 브레이크포인트별 레이아웃 최적화

![반응형 UI](./img/ui.gif)


## 🔹 화면 모드
- 다크모드 / 라이트모드 지원

![반응형 UI](./img/light.png)
![반응형 UI](./img/dark.png)

