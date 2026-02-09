package com.carepilot.service.call.emergency;

import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class EmergencyDetectionServiceImpl implements EmergencyDetectionService {
    
    private final ChatClient chatClient;
    
    public EmergencyDetectionServiceImpl(
            @Autowired(required = false) @Qualifier("openaiChatClient") ChatClient chatClient) {
        this.chatClient = chatClient;
    }
    
    @Override
    public EmergencyDetectionResult detectEmergency(String answer, String scenarioPurpose) {
        if (answer == null || answer.trim().isEmpty()) {
            return EmergencyDetectionResult.normal();
        }
        
        // 심층 확인이 필요한 경우 먼저 체크 (긴급 상황 판단 전에)
        if (needsDeepCheck(answer)) {
            String deepCheckMessage = "어디가 얼마나 아픈지 자세히 말씀해 주세요.";
            log.info("심층 확인 필요 감지: answer={}", answer);
            return EmergencyDetectionResult.needsDeepCheck(deepCheckMessage);
        }
        
        if (chatClient == null) {
            log.warn("ChatClient not configured, skipping emergency detection");
            return EmergencyDetectionResult.normal();
        }
        
        String prompt = String.format("""
            사용자가 '%s'라고 답변했습니다.
            시나리오 목적: %s
            
            이 답변이 긴급 상황(Emergency)인지 판단해주세요.
            
            긴급 상황의 예시:
            - "죽을 것 같다", "곧 죽을 것 같아"
            - "너무 아파서 못 견디겠다"
            - "응급실에 가야 할 것 같다"
            - "숨이 막힌다", "호흡이 안 된다"
            - "의식을 잃을 것 같다"
            - "심장이 터질 것 같다"
            - "아무것도 못 먹겠다", "물도 못 마시겠다"
            
            응답 형식:
            - 긴급 상황이면 첫 줄에: EMERGENCY
            - 정상이면 첫 줄에: NORMAL
            
            긴급 상황인 경우, 다음 줄에 대응 멘트를 작성해주세요.
            대응 멘트 예시: "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다."
            """, answer, scenarioPurpose != null ? scenarioPurpose : "");
        
        try {
            String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
            
            if (response != null) {
                String trimmedResponse = response.trim();
                if (trimmedResponse.startsWith("EMERGENCY")) {
                    String[] lines = trimmedResponse.split("\n");
                    String emergencyMessage = lines.length > 1 ? lines[1].trim() : 
                        "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다.";
                    
                    if (emergencyMessage.isEmpty()) {
                        emergencyMessage = "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다.";
                    }
                    
                    log.warn("긴급 상황 감지: answer={}, message={}", answer, emergencyMessage);
                    return EmergencyDetectionResult.emergency(emergencyMessage);
                }
            }
            
            return EmergencyDetectionResult.normal();
        } catch (Exception e) {
            log.error("긴급 상황 감지 실패: answer={}, error={}", answer, e.getMessage(), e);
            // 에러 발생 시 안전하게 정상으로 처리
            return EmergencyDetectionResult.normal();
        }
    }
    
    @Override
    public EmergencyDetectionResult detectEmergencySkipDeepCheck(String answer, String scenarioPurpose) {
        if (answer == null || answer.trim().isEmpty()) {
            return EmergencyDetectionResult.normal();
        }
        
        if (chatClient == null) {
            log.warn("ChatClient not configured, skipping emergency detection");
            return EmergencyDetectionResult.normal();
        }
        
        // 심층 확인 단계에서는 needsDeepCheck를 건너뛰고 바로 긴급 상황만 판단
        String prompt = String.format("""
            사용자가 '%s'라고 답변했습니다.
            시나리오 목적: %s
            
            이 답변이 긴급 상황(Emergency)인지 판단해주세요.
            
            긴급 상황의 예시:
            - "죽을 것 같다", "곧 죽을 것 같아"
            - "너무 아파서 못 견디겠다"
            - "응급실에 가야 할 것 같다"
            - "숨이 막힌다", "호흡이 안 된다"
            - "의식을 잃을 것 같다"
            - "심장이 터질 것 같다"
            - "아무것도 못 먹겠다", "물도 못 마시겠다"
            
            응답 형식:
            - 긴급 상황이면 첫 줄에: EMERGENCY
            - 정상이면 첫 줄에: NORMAL
            
            긴급 상황인 경우, 다음 줄에 대응 멘트를 작성해주세요.
            대응 멘트 예시: "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다."
            """, answer, scenarioPurpose != null ? scenarioPurpose : "");
        
        try {
            String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
            
            if (response != null) {
                String trimmedResponse = response.trim();
                if (trimmedResponse.startsWith("EMERGENCY")) {
                    String[] lines = trimmedResponse.split("\n");
                    String emergencyMessage = lines.length > 1 ? lines[1].trim() : 
                        "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다.";
                    
                    if (emergencyMessage.isEmpty()) {
                        emergencyMessage = "긴급 사항으로 판단되어 즉시 의료진에게 연락하겠습니다.";
                    }
                    
                    log.warn("심층 확인 단계에서 긴급 상황 감지: answer={}, message={}", answer, emergencyMessage);
                    return EmergencyDetectionResult.emergency(emergencyMessage);
                }
            }
            
            return EmergencyDetectionResult.normal();
        } catch (Exception e) {
            log.error("심층 확인 단계에서 긴급 상황 감지 실패: answer={}, error={}", answer, e.getMessage(), e);
            // 에러 발생 시 안전하게 정상으로 처리
            return EmergencyDetectionResult.normal();
        }
    }
    
    /**
     * 답변이 심층 확인이 필요한지 판단
     * "아프다" 같은 표현이 있으면 심층 확인 단계로 진입
     */
    private boolean needsDeepCheck(String answer) {
        if (answer == null || answer.trim().isEmpty()) {
            return false;
        }
        
        String lowerAnswer = answer.toLowerCase();
        // "아프다", "아파", "아픔", "통증" 등의 표현 감지
        return lowerAnswer.contains("아프") || 
               lowerAnswer.contains("아파") ||
               lowerAnswer.contains("아픔") ||
               lowerAnswer.contains("통증");
    }
}

