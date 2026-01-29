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
public class CareGroupOneDetailResponseDTO {
    private Long groupId;
    private String groupName;
    private String groupDescription;
    private String scenarioName;
    private String scenarioDescription;
    private String careTargetCount;
    private Boolean groupStatus;
    private String createdByName; //그룹 생성자
    private String createDate;

    private int low;
    private int medium;
    private int high;
    private int critical;

    //환자목록
    private List<CareTargetListResponseDTO> careList;

    //그룹통화 스케줄
    private List<CallScheduleListDTO> scheduleList;





}
