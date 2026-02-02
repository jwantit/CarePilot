package com.carepilot.service.callanalysis.schedule;

import com.carepilot.dto.callanalysis.ScheduleExtractionResultDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class ScheduleExtractionServiceImpl implements ScheduleExtractionService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public ScheduleExtractionServiceImpl(
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient,
            ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public ScheduleExtractionResultDTO extractScheduleRequest(String requestText) {
        if (requestText == null || requestText.isBlank() || chatClient == null) {
            return createEmptyResult(requestText);
        }

        String systemPrompt = """
                당신은 어르신 돌봄 서비스의 요청사항 분석 전문가입니다.
                사용자의 요청사항 텍스트를 분석하여 '통화 스케줄 변경' 의도가 있는지 판단하세요.
                
                [분석 규칙]
                1. 스케줄 변경 요청(시간 변경, 요일 변경 등)이 명확한 경우에만 isScheduleChangeRequest를 true로 설정하세요.
                2. 요일(dayOfWeek)은 반드시 MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY 중 하나로 매핑하세요.
                3. 시간(targetTime)은 HH:mm 형식(예: 15:00, 09:30)으로 추출하세요. '오후 3시'는 '15:00'으로 변환합니다.
                4. 요일이나 시간이 명시되지 않은 경우 null로 두세요.
                
                [출력 형식]
                반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 생략하세요.
                {
                  "isScheduleChangeRequest": boolean,
                  "dayOfWeek": "string or null",
                  "targetTime": "string or null",
                  "reason": "string"
                }
                """;

        try {
            String response = chatClient.prompt()
                    .system(systemPrompt)
                    .user("요청사항: " + requestText)
                    .call()
                    .content();

            log.info("[스케줄 추출] LLM 원문 응답: {}", response);

            // JSON 코드 블록 제거 (```json ... ``` 형식 처리)
            String cleanedResponse = response.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
            }
            cleanedResponse = cleanedResponse.trim();

            log.info("[스케줄 추출] 정제된 응답: {}", cleanedResponse);

            ScheduleExtractionResultDTO result = objectMapper.readValue(cleanedResponse, ScheduleExtractionResultDTO.class);
            result.setOriginalText(requestText);
            log.info("[스케줄 추출] 파싱 성공: isScheduleChangeRequest={}, dayOfWeek={}, targetTime={}", 
                    result.getIsScheduleChangeRequest(), result.getDayOfWeek(), result.getTargetTime());
            return result;

        } catch (Exception e) {
            log.error("[스케줄 추출] 분석 중 오류 발생: {}", e.getMessage(), e);
            return createEmptyResult(requestText);
        }
    }

    private ScheduleExtractionResultDTO createEmptyResult(String text) {
        return ScheduleExtractionResultDTO.builder()
                .isScheduleChangeRequest(false)
                .originalText(text)
                .build();
    }
}


