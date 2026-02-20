package com.carepilot.config;

import com.carepilot.service.aiChat.CarePilotToolsService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class AiClientsConfig {


    private final CarePilotToolsService carePilotToolsService;

    @Bean
    @Qualifier("ollamaChatClient")
    public ChatClient ollamaChatClient(
            @Qualifier("ollamaChatModel") ChatModel ollamaChatModel
    ) {
        return ChatClient.builder(ollamaChatModel).build();
    }

    @Bean
    @Qualifier("openaiChatClient")
    public ChatClient openaiChatClient(
            @Qualifier("openAiChatModel") ChatModel openAiChatModel
    ) {
        return ChatClient.builder(openAiChatModel).build();
    }
}