package com.carepilot.dto.caretarget;

import com.carepilot.dto.caretarget.caretargetgroup.CareGroupDetailResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareTargetDetailResponseDTO {
    private String file;
    private String name;
    private int age;
    private String gender;
    private String disease;
    private String targetPhone;
    private CareTargetDoctorResponseDTO careTargetDoctorResponseDTO;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelationship;
    private String aiMemo;
    private List<RiskTrendDTO> riskTrendDTOS;
    private List<CallHistoryDTO> callHistoryDTOS;
    private List<CareGroupDetailResponseDTO> careGroups;

}
