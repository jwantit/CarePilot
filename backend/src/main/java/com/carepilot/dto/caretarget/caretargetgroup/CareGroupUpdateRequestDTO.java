package com.carepilot.dto.caretarget.caretargetgroup;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareGroupUpdateRequestDTO {
    private List<Long> careTargetIds;
    private Long organizationId;
    private Long careGroupId;
    private String groupName;
    private String groupDescription;
    private Boolean groupStatus;
}
