package com.carepilot.domain.config;

import com.carepilot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "scenario_question",
       uniqueConstraints = @UniqueConstraint(columnNames = {"scenario_id", "question_order"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScenarioQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    // @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    // @Column(name = "question_order", nullable = false)
    @Column(name = "question_order")
    private Integer questionOrder;

    // @Column(name = "is_required", nullable = false)
    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Builder
    public ScenarioQuestion(Scenario scenario, String questionText,
                          Integer questionOrder, Boolean isRequired) {
        this.scenario = scenario;
        this.questionText = questionText;
        this.questionOrder = questionOrder;
        this.isRequired = isRequired != null ? isRequired : false;
    }
}

