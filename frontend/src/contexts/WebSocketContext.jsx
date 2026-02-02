import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const auth = useSelector((state) => state.auth);
  const organizationId = auth.user?.organizationId;

  // 알림 처리 함수
  const handleNotification = useCallback((message) => {
    // 수신 문자 알림: 토스트 없이 배지 숫자만 갱신 (SmsChatWidget에서 구독)
    if (message.type === 'NEW_INBOUND_SMS') {
      const delta = message.delta != null ? message.delta : 1;
      window.dispatchEvent(new CustomEvent('sms-unread', { detail: { delta } }));
      return;
    }

    const severity = message.severity;
    const title = message.title || message.text || '새 알림이 도착했습니다!';
    const description = message.text || message.description || '';

    // 심각도에 따라 토스트 타입 결정
    if (severity === 'CRITICAL') {
      toast.error(title, {
        description: description,
        duration: 5000,
      });
    } else if (severity === 'HIGH') {
      toast.error(title, {
        description: description,
        duration: 4000,
      });
    } else if (severity === 'MEDIUM') {
      toast(title, {
        description: description,
        icon: '⚠️',
        duration: 3000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
        },
        iconTheme: {
          primary: '#F59E0B',
          secondary: '#fff',
        },
      });
    } else if (severity === 'LOW') {
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
    window.dispatchEvent(new CustomEvent('notification-received', { detail: message }));
  }, []);

  useEffect(() => {
    // organizationId가 없으면 WebSocket 연결하지 않음
    if (!organizationId) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        
        // 조직별 알림 구독: /topic/org/{organizationId}
        const orgTopic = `/topic/org/${organizationId}`;
        console.log('Subscribing to organization topic:', orgTopic);
        
        client.subscribe(orgTopic, (message) => {
          const notification = JSON.parse(message.body);
          handleNotification(notification);
        });
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('WebSocket STOMP Error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [handleNotification, organizationId]);

  const sendMessage = (message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: '/app/notification',
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
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

