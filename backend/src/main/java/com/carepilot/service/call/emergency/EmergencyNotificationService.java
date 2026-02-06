package com.carepilot.service.call.emergency;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.caretarget.CareTarget;

public interface EmergencyNotificationService {
    /**
     * 긴급 상황 발생 시 알림, Task 생성, SMS 전송 등을 처리
     * 
     * @param call 통화 정보
     * @param careTarget 케어 대상자
     * @param emergencyAnswer 긴급 상황 감지된 답변
     * @param emergencyMessage 긴급 상황 대응 메시지
     */
    void handleEmergency(Call call, CareTarget careTarget, 
                        String emergencyAnswer, String emergencyMessage);
}

