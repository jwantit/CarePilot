package com.carepilot.dto.caretarget.caretargetgroup;


import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CareGroupListResponseDTO {
    private String groupName; //그룹이름 | 당뇨병 환자 그룹
    private String groupDescription; //그룹 설명 | 당뇨병 진단을 받은 환자들
    private String groupStatus; // 활성화 상태
    private String groupType; // 질병별 -> 이넘 그룹타입 set
    private String careTargetCount; //환자수
    private List<CareTargetListResponseDTO> careList;
}
