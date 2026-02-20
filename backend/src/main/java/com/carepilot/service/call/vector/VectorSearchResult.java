package com.carepilot.service.call.vector;

import lombok.Builder;
import lombok.Getter;

import java.util.Objects;

@Getter
@Builder
public class VectorSearchResult {
    private String question;
    private String answer;
    private String timestamp;
    private double similarity;
    
    /**
     * LinkedHashSet에서 중복 제거를 위한 equals 구현
     * question, answer, timestamp가 모두 같으면 같은 것으로 간주
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VectorSearchResult that = (VectorSearchResult) o;
        return Objects.equals(question, that.question) &&
               Objects.equals(answer, that.answer) &&
               Objects.equals(timestamp, that.timestamp);
    }
    
    /**
     * LinkedHashSet에서 중복 제거를 위한 hashCode 구현
     */
    @Override
    public int hashCode() {
        return Objects.hash(question, answer, timestamp);
    }
}

