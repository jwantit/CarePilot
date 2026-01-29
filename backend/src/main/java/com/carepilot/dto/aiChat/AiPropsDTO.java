package com.carepilot.dto.aiChat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiPropsDTO {
    private String organizationId;
    private String role;
    private String userId;
    private String userName;
    private String userOrganization;
    private String userOrganizationNumber;
    private String userRole;
}
