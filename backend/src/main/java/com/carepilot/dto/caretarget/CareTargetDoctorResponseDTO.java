package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareTargetDoctorResponseDTO {
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialty;
}
