package com.carepilot.dto.caretarget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareTargetInsertRequestDTO {
    private String name; //케대 이름
    private int age; //케대 나이
    private String gender;
    private String disease;//케대 질환
    private String targetPhone;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelationship;//케대 - 보호자 관계
    private Long doctorId;//담당 의료진ID
    private Long organizationId; //업체ID
}
