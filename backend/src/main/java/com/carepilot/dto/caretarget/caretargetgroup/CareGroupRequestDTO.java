package com.carepilot.dto.caretarget.caretargetgroup;

import com.carepilot.domain.caretarget.GroupType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareGroupRequestDTO {
    private List<Long> careTargetId;
    private Long scenarioId;
    private Long organizationId;
    private String groupName;
    private String groupDescription;
    private Boolean groupStatus;
    private Long userId;
}
