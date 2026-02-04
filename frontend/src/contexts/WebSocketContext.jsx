import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNotificationConfig } from "../hooks/useNotificationConfig";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const auth = useSelector((state) => state.auth);
  const organizationId = auth.user?.organizationId;
  const userId = auth.user?.userId;

  // 알림 설정값 가져오기 (ref 객체)
  const notificationConfigRef = useNotificationConfig(userId);

  // 알림 처리 함수
  const handleNotification = useCallback(
    (message) => {
      // 수신 문자 알림: SMS 알림 설정 시 토스트 표시, 항상 배지 갱신
      if (message.type === "NEW_INBOUND_SMS") {
        const delta = message.delta != null ? message.delta : 1;
        window.dispatchEvent(
          new CustomEvent("sms-unread", { detail: { delta } }),
        );

        if (notificationConfigRef.current.smsEnabled) {
          const from = message.from || "알 수 없음";
          const body = message.body || "(내용 없음)";
          const displayFrom = message.careTargetName || from;
          const preview =
            body.length > 50 ? body.substring(0, 50) + "..." : body;

          toast.success(`${displayFrom}님으로부터 문자가 수신되었습니다.`, {
            description: preview,
            duration: 4000,
          });
        }
        return;
      }

      // 회원가입 승인 요청 알림: 백엔드에서 MANAGER만 개인 큐로 전송하므로, 이메일 알림 설정만 확인
      if (message.type === "SIGNUP_APPROVAL_REQUEST") {
        if (notificationConfigRef.current.emailEnabled) {
          const title = message.title || "회원가입 승인 요청";
          const text =
            message.text ||
            `${message.userName || "사용자"}님이 회원가입 승인을 요청했습니다.`;

          toast.success(title, {
            description: text,
            duration: 5000,
          });
        }
        return;
      }

      // 위험 감지/통화 실패/긴급 상황 알림: 설정 확인 후 토스트 표시
      if (message.severity) {
        let shouldShow = true;

        // 알림 타입별 설정 확인
        if (
          message.type === "RISK_DETECTION" &&
          !notificationConfigRef.current.riskDetectionEnabled
        ) {
          shouldShow = false;
        } else if (
          message.type === "CALL" &&
          !notificationConfigRef.current.callFailureEnabled
        ) {
          shouldShow = false;
        } else if (
          message.type === "EMERGENCY" &&
          !notificationConfigRef.current.emergencyEventEnabled
        ) {
          shouldShow = false;
        }

        if (!shouldShow) {
          // 설정에 따라 토스트 표시 안 함, 하지만 이벤트는 발생시킴
          window.dispatchEvent(
            new CustomEvent("notification-received", { detail: message }),
          );
          return;
        }
      }

      const severity = message.severity;
      const title = message.title || message.text || "새 알림이 도착했습니다!";
      const description = message.text || message.description || "";

      // 심각도에 따라 토스트 타입 결정
      if (severity === "CRITICAL") {
        toast.error(title, {
          description: description,
          duration: 5000,
        });
      } else if (severity === "HIGH") {
        toast.error(title, {
          description: description,
          duration: 4000,
        });
      } else if (severity === "MEDIUM") {
        toast(title, {
          description: description,
          icon: "⚠️",
          duration: 3000,
          style: {
            background: "#FEF3C7",
            color: "#92400E",
          },
          iconTheme: {
            primary: "#F59E0B",
            secondary: "#fff",
          },
        });
      } else if (severity === "LOW") {
        toast.success(title, {
          description: description,
          duration: 3000,
        });
      } else {
        // 심각도가 없으면 기본 success
        toast.success(title, {
          description: description,
          duration: 3000,
        });
      }

      // 알림 페이지에서 목록 새로고침을 위한 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("notification-received", { detail: message }),
      );
    },
    [], // ref 객체는 변하지 않으므로 의존성 배열 비움
  );

  useEffect(() => {
    // organizationId와 userId가 없으면 WebSocket 연결하지 않음
    if (!organizationId || !userId) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket Connected");
        setIsConnected(true);

        // 조직별 알림 구독: /topic/org/{organizationId}
        const orgTopic = `/topic/org/${organizationId}`;
        console.log("Subscribing to organization topic:", orgTopic);

        client.subscribe(orgTopic, (message) => {
          const notification = JSON.parse(message.body);
          handleNotification(notification);
        });

        // 개인별 알림 구독: /queue/users/{userId}
        const userQueue = `/queue/users/${userId}`;
        console.log("Subscribing to user queue:", userQueue);

        client.subscribe(userQueue, (message) => {
          const notification = JSON.parse(message.body);
          handleNotification(notification);
        });
      },
      onDisconnect: () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("WebSocket STOMP Error:", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [handleNotification, organizationId, userId]);

  const sendMessage = (message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: "/app/notification",
        body: JSON.stringify(message),
      });
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }
  return context;
}
