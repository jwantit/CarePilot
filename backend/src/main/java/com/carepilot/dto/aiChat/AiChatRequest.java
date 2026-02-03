package com.carepilot.dto.aiChat;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiChatRequest {
    private String message;
    private Long fileId;
}
