package com.carepilot.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Log4j2
@Controller
public class NotificationController {
    
    // /app/notification 주소로 메세지를 보내면 이 메세지가 실행됨(websocketConfig의 /app prefix 때문에 붙음)
    @MessageMapping("/notification")
    @SendTo("/topic/notifications") //이 메서드의 리턴값을 구독자들에게 전송
    public String sendNotification(String message) {

        log.info("sendNotification: " + message);
        return message;
    }
}
