package com.carepilot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

//Spring에서 WebSocket + STOMP 기반 실시간 메시징 서버를 여는 설정 클래스
// 프론트엔드(React)와 실시간 연결 유지 
// 서버에서 발생한 이벤트를 즉시 브라우저로 push
// 알림,상태 업데이트,위험감지를 실시간 전송
@Configuration
@EnableWebSocketMessageBroker //websocket + 메세지브로커(STOMP)모드 활성화 어노테이션 
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer { //WebSocketMessageBrokerConfigurer 를 상속 : WebSocket 메세징 구조를 직접 설정하겠다는 의미
    
    //메세지 브로커 설정
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // enableSimpleBroker : 서버내부에 간단한 메세지 브로커 생성.
        // topic : 전체 구독용(브로드캐스트), /queue : 개인용 메세지
        config.enableSimpleBroker("/topic", "/queue");
        // setApplicationDestinationPrefixes : 클라이언트 -> 서버로 보낼 때 사용하는 prefix
        config.setApplicationDestinationPrefixes("/app");
    }

    //웹소켓 접속 주소
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // addEndpoint : 프론트가 연결할 주소 ex) ws://localhost:8080/ws (React에서 여기로 접속)
                .setAllowedOriginPatterns("http://localhost:3000") // setAllowedOriginPatterns("*")  : CORS 허용, 개발중이므로 일단 전체 허용
                .withSockJS(); //websocketdl 막힌 환경에서도 HTTP 기반 fallback 가능 (기업망, 구형 브라우저 대비)
    }
}