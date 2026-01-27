package com.carepilot.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDTO {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String organization;  // 업체명
    private String organizationNumber; // 업체번호
    private String role;
    private String status;
    private LocalDateTime approvalRequestedAt;
    private LocalDateTime approvalProcessedAt;
}
