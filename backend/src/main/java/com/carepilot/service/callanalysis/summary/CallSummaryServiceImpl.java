package com.carepilot.service.callanalysis.summary;

import com.carepilot.domain.callanalysis.RiskSignal;
import com.carepilot.dto.callanalysis.CallSummaryResultDTO;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@Log4j2
public class CallSummaryServiceImpl implements CallSummaryService {

    /** 시그널 코드명만 (예: CHEST_PAIN, MED_NONADHERENCE) */
    private static final String SIGNAL_NAMES = Arrays.stream(RiskSignal.values())
            .map(Enum::name)
            .collect(Collectors.joining(", "));

    /** 프롬프트용: 코드명 + 한글 설명. 통화 내용과 매칭할 수 있도록 함. */
    private static final String SIGNAL_LIST_WITH_LABELS = Arrays.stream(RiskSignal.values())
            .map(s -> s.name() + "(" + s.getLabelKr() + ")")
            .collect(Collectors.joining(", "));

    /** 프롬프트용: 시그널별 매칭 예시. enum에서 가져온 예시를 포맷팅. */
    private static final String SIGNAL_MATCHING_EXAMPLES = Arrays.stream(RiskSignal.values())
            .map(s -> String.format("  - %s: %s", s.name(), s.getMatchingExamples()))
            .collect(Collectors.joining("\n"));

    private final ChatClient chatClient;

    public CallSummaryServiceImpl(
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @Override
    public CallSummaryResultDTO summarize(String transcript) {
        if (transcript == null || transcript.isBlank()) {
            return CallSummaryResultDTO.builder()
                    .summary(null)
                    .aiMemo(null)
                    .signalsJson("[]")
                    .build();
        }

        if (chatClient == null) {
            log.warn("ChatClient not configured (openaiChatClient). Returning empty summary.");
            return CallSummaryResultDTO.builder()
                    .summary(null)
                    .aiMemo(null)
                    .signalsJson("[]")
                    .build();
        }

        String systemPrompt = """
                당신은 케어 대상자와의 통화 내용을 분석하는 어시스턴트입니다.
                통화 전문을 읽고 다음 형식으로만 응답하세요.

                [요약]
                - 통화 내용을 2~3문장으로 요약

                [비고]
                - 특이사항·주의할 점이 있으면 간단히 적고, 없으면 '없음' 한 단어만

                [시그널]
                - 통화 내용에서 아래 시그널에 해당하는 언급이 있으면 **반드시 모두** 추출하세요.
                - 해당되는 시그널이 **하나도 없을 때만** [] 를 출력하세요.
                - **중요: signal 값은 반드시 아래 enum에 있는 코드명(영문)만 사용하세요. enum에 없는 시그널은 절대 사용하지 마세요.**
                - signal 값 목록: %s
                - 시그널별 한글 의미(참고): %s
                
                - 시그널 매칭 예시(통화 내용에 아래 표현이 있으면 해당 시그널로 매핑):
%s
                  - enum에 없는 증상(예: FATIGUE, SWEATING 등)은 무시하거나 가장 가까운 시그널로 매핑
                  - "어제부터", "며칠째" 같은 시간 표현은 severity 판단에만 사용
                
                - severity: 0~3 (0=거의해당없음, 1=약함, 2=보통, 3=심함)
                - severity 산정 규칙(반드시 준수, 임의로 흔들리지 말 것):
                  - 0: 부정/해당없음/과거에 잠깐 있었으나 현재는 없음 수준
                  - 1: 경미/가끔/하루 미만/일상 가능(예: "조금", "살짝", "한 번")
                  - 2: 중등도/지속(대략 1일 이상) 또는 반복/기능 저하 동반(예: "며칠째", "계속", "일상에 지장")
                  - 3: 중증/응급 수준 또는 즉시 조치 필요(예: 실신/의식소실, 자살 암시, 뇌졸중 의심, 심한 흉통/호흡곤란, 심한 혼미)
                  - 확신이 없으면 1로 두고, 같은 통화 전문이면 같은 severity가 나오도록 위 규칙대로 결정
                
                - **[시그널] 아래에는 오직 JSON 배열만 출력하세요. 절대 다른 텍스트, 설명, 줄바꿈(\\n), 리스트 형식([CHEST_PAIN, ...]), 하이픈(-) 등을 포함하지 마세요.**
                - **반드시 [{"signal":"시그널코드","severity":숫자},...] 형식만 한 줄로 출력하세요.**
                - **잘못된 예: [CHEST_PAIN, ...]\\n- [{"signal":...}] (이런 형식 절대 금지)**
                - **올바른 예: [{"signal":"POOR_INTAKE","severity":1},{"signal":"DEHYDRATION","severity":2},{"signal":"MED_NONADHERENCE","severity":1}]**
                """.formatted(SIGNAL_NAMES, SIGNAL_LIST_WITH_LABELS, SIGNAL_MATCHING_EXAMPLES);

        String userPrompt = "다음 통화 전문을 분석해 주세요.\n\n---\n" + transcript;

        String response = chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .call()
                .content();

        log.info("[시그널 디버그] LLM 원문 응답 길이={} chars", response != null ? response.length() : 0);
        if (response != null && !response.isBlank()) {
            log.info("[시그널 디버그] LLM 원문 응답 본문:\n{}", response);
        }
        return parseSummaryResponse(response);
    }

    private CallSummaryResultDTO parseSummaryResponse(String response) {
        if (response == null || response.isBlank()) {
            return CallSummaryResultDTO.builder().summary(null).aiMemo(null).signalsJson("[]").build();
        }

        String summary = null;
        String aiMemo = null;
        String signalsJson = "[]";

        int summaryStart = response.indexOf("[요약]");
        int summaryEnd = response.indexOf("[비고]");
        int signalsStart = response.indexOf("[시그널]");

        if (summaryStart >= 0) {
            int from = response.indexOf("\n", summaryStart) + 1;
            int to = summaryEnd >= 0 ? summaryEnd : response.length();
            summary = response.substring(from, to).trim();
            if (summary.isEmpty()) summary = null;
        }
        if (summaryEnd >= 0) {
            int from = response.indexOf("\n", summaryEnd) + 1;
            int to = signalsStart >= 0 ? signalsStart : response.length();
            if (from > 0 && from < response.length()) {
                aiMemo = response.substring(from, to).trim();
                if ("없음".equals(aiMemo) || aiMemo.isEmpty()) aiMemo = null;
            }
        }
        if (signalsStart >= 0) {
            int from = response.indexOf("\n", signalsStart) + 1;
            if (from > 0 && from < response.length()) {
                String raw = response.substring(from).trim();
                log.info("[시그널 디버그] [시그널] 구간 raw 추출: {}", raw);
                signalsJson = normalizeSignalsJson(raw);
                log.info("[시그널 디버그] 정규화 후 signalsJson: {}", signalsJson);
            } else {
                log.warn("[시그널 디버그] [시그널] 다음 줄 없음. signalsStart={}, response.length()={}", signalsStart, response.length());
            }
        } else {
            log.warn("[시그널 디버그] [시그널] 구간을 찾지 못함. response에 '[시그널]' 없음.");
        }

        return CallSummaryResultDTO.builder()
                .summary(summary)
                .aiMemo(aiMemo)
                .signalsJson(signalsJson)
                .build();
    }

    // LLM이 준 시그널 부분을 JSON 배열 형태로 정리. 잘못된 경우 "[]" 반환.
    // LLM이 "[CHEST_PAIN, ...]\n- [{\"signal\":...}]" 같은 형식으로 보낼 수 있으므로,
    // [{ 로 시작하는 실제 JSON 배열만 추출.
    private String normalizeSignalsJson(String raw) {
        if (raw == null || raw.isBlank()) {
            log.info("[시그널 디버그] normalizeSignalsJson: raw 비어있음 → []");
            return "[]";
        }
        String trimmed = raw.trim();
        
        // [{ 로 시작하는 JSON 배열 찾기 (실제 JSON 객체 배열)
        int jsonArrayStart = trimmed.indexOf("[{");
        if (jsonArrayStart >= 0) {
            // [{ 부터 시작해서 마지막 ] 까지 추출
            int end = trimmed.lastIndexOf(']');
            if (end > jsonArrayStart) {
                String jsonArray = trimmed.substring(jsonArrayStart, end + 1);
                log.info("[시그널 디버그] normalizeSignalsJson: [{ 로 시작하는 JSON 배열 추출 성공: {}", jsonArray);
                return jsonArray;
            }
        }
        
        // [{ 가 없으면 일반 [ 로 시작하는 배열 시도 (빈 배열 [] 도 가능)
        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');
        if (start >= 0 && end > start) {
            String candidate = trimmed.substring(start, end + 1);
            // 빈 배열이거나, [{ 로 시작하는 경우만 반환
            if ("[]".equals(candidate) || candidate.startsWith("[{")) {
                return candidate;
            }
            log.warn("[시그널 디버그] normalizeSignalsJson: [ 로 시작하지만 유효한 JSON 배열 아님, candidate={}", candidate);
        }
        
        log.warn("[시그널 디버그] normalizeSignalsJson: JSON 배열 형태를 찾지 못함, raw={}", raw);
        return "[]";
    }
}
