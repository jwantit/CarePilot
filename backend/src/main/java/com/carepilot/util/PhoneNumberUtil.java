package com.carepilot.util;

import lombok.extern.log4j.Log4j2;

/**
 * 전화번호 파싱 유틸리티
 * 한국 전화번호를 Twilio 형식(+82XXXXXXXXXX)으로 변환
 */
@Log4j2
public class PhoneNumberUtil {

    /**
     * 전화번호 정규화 (하이픈, 공백 제거)
     * 010-0000-0000 → 01000000000
     * 
     * @param phoneNumber 전화번호 (예: "010-1234-5678", "010 1234 5678")
     * @return 정규화된 전화번호 (예: "01012345678"), null이거나 비어있으면 빈 문자열 반환
     */
    public static String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return "";
        }
        return phoneNumber.replaceAll("[\\s-]", "");
    }

    /**
     * 한국 전화번호를 Twilio 형식으로 파싱
     * 
     * @param phoneNumber 전화번호 (예: "010-1234-5678", "01012345678", "+821012345678)
     * @return Twilio 형식 전화번호 (예: "+821012345678")
     * @throws IllegalArgumentException 전화번호가 null이거나 비어있을 때
     */
    public static String parsePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호가 입력되지 않았습니다.");
        }

        // 공백과 하이픈 제거 (normalizePhoneNumber 재사용)
        String cleaned = normalizePhoneNumber(phoneNumber);

        // 이미 +82로 시작하면 그대로 반환
        if (cleaned.startsWith("+82")) {
            log.debug("전화번호 파싱 완료 (이미 +82 형식): {}", cleaned);
            return cleaned;
        }

        // 010으로 시작하면 +82로 변환
        if (cleaned.startsWith("010")) {
            String parsed = "+82" + cleaned.substring(1);
            log.debug("전화번호 파싱 완료 (010 형식): {} -> {}", phoneNumber, parsed);
            return parsed;
        }

        // 0으로 시작하면 +82로 변환
        if (cleaned.startsWith("0")) {
            String parsed = "+82" + cleaned.substring(1);
            log.debug("전화번호 파싱 완료 (0으로 시작): {} -> {}", phoneNumber, parsed);
            return parsed;
        }

        // 그 외의 경우 +82를 앞에 추가
        String parsed = "+82" + cleaned;
        log.debug("전화번호 파싱 완료 (기타 형식): {} -> {}", phoneNumber, parsed);
        return parsed;
    }
}

