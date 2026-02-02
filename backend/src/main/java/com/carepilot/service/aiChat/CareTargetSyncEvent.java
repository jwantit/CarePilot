package com.carepilot.service.aiChat;

import com.carepilot.domain.caretarget.CareTarget;

import java.util.List;

public record CareTargetSyncEvent(Long organizationId, String action1, String action2) {
}