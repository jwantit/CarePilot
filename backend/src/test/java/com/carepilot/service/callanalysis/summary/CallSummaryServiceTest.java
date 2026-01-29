package com.carepilot.service.callanalysis.summary;

import com.carepilot.dto.callanalysis.CallSummaryResultDTO;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Log4j2
class CallSummaryServiceTest {

    @Autowired
    CallSummaryService callSummaryService;

    @Test
    @DisplayName("transcript가 null이면 summary, aiMemo 모두 null 반환")
    void summarize_nullTranscript_returnsNullSummaryAndAiMemo() {
        CallSummaryResultDTO result = callSummaryService.summarize(null);

        assertThat(result).isNotNull();
        assertThat(result.getSummary()).isNull();
        assertThat(result.getAiMemo()).isNull();
    }

    @Test
    @DisplayName("transcript가 빈 문자열이면 summary, aiMemo 모두 null 반환")
    void summarize_blankTranscript_returnsNullSummaryAndAiMemo() {
        CallSummaryResultDTO result = callSummaryService.summarize("");

        assertThat(result).isNotNull();
        assertThat(result.getSummary()).isNull();
        assertThat(result.getAiMemo()).isNull();
    }

    @Test
    @DisplayName("transcript가 공백만 있으면 summary, aiMemo 모두 null 반환")
    void summarize_whitespaceOnlyTranscript_returnsNullSummaryAndAiMemo() {
        CallSummaryResultDTO result = callSummaryService.summarize("   \n\t  ");

        assertThat(result).isNotNull();
        assertThat(result.getSummary()).isNull();
        assertThat(result.getAiMemo()).isNull();
    }

    @Test
    @DisplayName("통화 전문을 넣으면 DTO를 반환한다 (API 키 있을 때 실제 요약, 없으면 null)")
    void summarize_withTranscript_returnsResult() {
        String transcript = """
                AI: 안녕하세요. 오늘 컨디션은 어떠세요?
                케어대상: 새벽부터 숨이 좀 차고 가슴이 답답해요.
                AI: 숨이 찬 느낌이 언제부터 시작됐나요?
                케어대상: 어제 밤부터 조금 있었는데 오늘 아침에 더 심해졌어요.
                AI: 통증이 있나요? 있다면 어디가 아프고 얼마나 지속되나요?
                케어대상: 왼쪽 가슴이 쥐어짜는 느낌이에요. 10분 정도 계속 갔어요.
                AI: 어지럽거나 식은땀이 나거나 메스꺼움은요?
                케어대상: 식은땀이 좀 났고 약간 울렁거렸어요.
                AI: 지금은 통증이 계속되나요?
                케어대상: 지금은 덜한데 답답한 느낌은 남아있어요.
                AI: 혈압이나 맥박을 재보셨나요?
                케어대상: 집에 기계가 없어서 못 재봤어요.
                AI: 오늘 약은 드셨나요?
                케어대상: 혈압약은 먹었는데 아침 식사를 못 해서요.
                AI: 최근에 무리하거나 스트레스가 있었나요?
                케어대상: 어제 계단을 많이 오르고 나서부터 더 힘들었어요.
                AI: 지금 혼자 계신가요?
                케어대상: 네 혼자 있어요.
                """;

        CallSummaryResultDTO result = callSummaryService.summarize(transcript);

        assertThat(result).isNotNull();
        log.info("[요약 테스트 결과] summary={}, aiMemo={}", result.getSummary(), result.getAiMemo());
        // API 키가 있으면 summary가 채워지고, 없으면 null 반환
        // 예외 없이 호출만 성공하면 됨
        if (result.getSummary() != null) {
            assertThat(result.getSummary()).isNotBlank();
        }
    }
}
