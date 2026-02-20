package com.carepilot.domain.sms;

/**
 * 발신 문자 발송 주체: 사용자(화면) / AI(시스템 자동)
 */
public enum SentBy {
    USER,  // 내가 보낸 문자 (위젯에서 발송)
    AI     // AI/시스템이 보낸 문자 (일정 안내, 알림 등)
}
