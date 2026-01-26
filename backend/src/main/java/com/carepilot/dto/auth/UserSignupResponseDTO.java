package com.carepilot.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserSignupResponseDTO {
    private String message;
    private String status;
}

