package com.carepilot.service.call.emergency;

public interface EmergencyDetectionService {
    /**
     * 답변이 긴급 상황인지 판단
     * @param answer 어르신의 답변
     * @param scenarioPurpose 시나리오 목적
     * @return EmergencyDetectionResult (긴급 여부, 대응 멘트)
     */
    EmergencyDetectionResult detectEmergency(String answer, String scenarioPurpose);
    
    /**
     * 답변이 긴급 상황인지 판단 (심층 확인 단계용 - needsDeepCheck 무시)
     * @param answer 어르신의 답변
     * @param scenarioPurpose 시나리오 목적
     * @return EmergencyDetectionResult (긴급 여부, 대응 멘트)
     */
    EmergencyDetectionResult detectEmergencySkipDeepCheck(String answer, String scenarioPurpose);
}

