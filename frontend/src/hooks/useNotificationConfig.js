import { useEffect, useRef } from "react";
import { getNotificationConfig } from "../api/notificationConfigApi";

/**
 * 알림 설정 관리 커스텀 훅
 * - 설정값 로드 및 관리
 * - 설정 변경 이벤트 구독
 * @param {number} userId - 사용자 ID
 * @returns {React.MutableRefObject} 알림 설정값 ref 객체
 */
export function useNotificationConfig(userId) {
  const configRef = useRef({
    smsEnabled: true,
    emailEnabled: true,
    riskDetectionEnabled: true,
    callFailureEnabled: true,
    emergencyEventEnabled: true,
  });

  useEffect(() => {
    if (!userId) return;

    const loadConfig = async () => {
      try {
        const config = await getNotificationConfig(userId);
        configRef.current = {
          smsEnabled: config.smsEnabled !== false,
          emailEnabled: config.emailEnabled !== false,
          riskDetectionEnabled: config.riskDetectionEnabled !== false,
          callFailureEnabled: config.callFailureEnabled !== false,
          emergencyEventEnabled: config.emergencyEventEnabled !== false,
        };
      } catch (error) {
        console.error("알림 설정 조회 실패:", error);
        // 에러 시 기본값 유지
      }
    };

    loadConfig();

    // 설정 변경 이벤트 구독
    const handleConfigUpdate = () => {
      loadConfig();
    };

    window.addEventListener("notification-config-updated", handleConfigUpdate);

    return () => {
      window.removeEventListener(
        "notification-config-updated",
        handleConfigUpdate,
      );
    };
  }, [userId]);

  return configRef; // ref 객체 자체를 반환
}
