import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs'; //STOMP 프로토콜 클라이언트
import SockJS from 'sockjs-client'; //websocket fasllback 지원 

export function useWebSocket(onMessage) {
  const clientRef = useRef(null); //렌더링과 무관하게 WebSocket 클라이언트 인스턴스 유지

  //useEffect: 컴포넌트 마운트 시 연결, 언마운트 시 연결 해제 
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000, //연결 끊기면 5초후 자동 재연결 
      heartbeatIncoming: 4000, //4초마다 ping/pong 체크. 연결 살아있는지 감지 
      heartbeatOutgoing: 4000,
      onConnect: () => { //연결 성공 시 호출
        console.log('WebSocket Connected');
        client.subscribe('/topic/notifications', (message) => { //알림 메시지 구독(브로드캐스트)
          if (onMessage) {
            onMessage(JSON.parse(message.body));
          }
        });
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
      },
    });

    client.activate(); //웹소켓 실제 연결 시작, 활성화 
    clientRef.current = client; // ref에 저장

    return () => {//컴포넌트 언마운트 시 정리
      client.deactivate();  // 웹소켓 종료, 메모리 누수 방지 
    };
  }, [onMessage]);

  const sendMessage = (message) => { //서버로 알림 메시지 전송 함수
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: '/app/notification',
        body: JSON.stringify(message),
      });
    }
  };

  return { sendMessage };
}