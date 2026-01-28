package com.carepilot.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Priority {
    LOW("낮음"),
    MEDIUM("보통"),
    HIGH("높음"),
    URGENT("긴급");

    private final String koName;
}

