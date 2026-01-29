package com.carepilot.dto.config;

import com.carepilot.domain.config.DoctorRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDTO {
    private Long doctorId;
    private Long organizationId;
    private String name;
    private String email;
    private String phone;
    private String specialty;
    private DoctorRole role;
    private Boolean isActive;
    private String memo;
}

