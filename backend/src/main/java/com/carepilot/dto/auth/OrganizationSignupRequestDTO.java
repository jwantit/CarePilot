package com.carepilot.dto.auth;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrganizationSignupRequestDTO {
    private String organizationName;
    private String email;
    private String password;
    private String name;
}

