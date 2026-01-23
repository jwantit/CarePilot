package com.carepilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CsvDTO {

    private String name;        // 이름
    private int age;        // 나이
    private String gender;      // 성별
    private String phone;        // 전화번호
    private String disease;      // 질환
    private String guardianName;     // 보호자 이름
    private String guardianPhone;    // 보호자 번호
    private String guardianRelationship;     // 보호자 관계
}
