package com.carepilot.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApprovalResponseDTO {
    private String message;
    private String status;
    private String email;
}

