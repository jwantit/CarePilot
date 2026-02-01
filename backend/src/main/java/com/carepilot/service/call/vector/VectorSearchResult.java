package com.carepilot.service.call.vector;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VectorSearchResult {
    private String question;
    private String answer;
    private String timestamp;
    private double similarity;
}

