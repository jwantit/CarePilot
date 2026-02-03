package com.carepilot.dto.auth;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserSignupRequestDTO {
    private String organizationNumber;
    private String email;
    private String password;
    private String name;
    private String phone;
}

