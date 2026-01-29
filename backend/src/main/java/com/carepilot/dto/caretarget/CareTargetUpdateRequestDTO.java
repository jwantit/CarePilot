package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareTargetUpdateRequestDTO {
    private String name;
    private int age;
    private String gender;
    private String disease;
    private String targetPhone;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelationship;
    private Long doctorId;
    private Boolean isDelete;










}
