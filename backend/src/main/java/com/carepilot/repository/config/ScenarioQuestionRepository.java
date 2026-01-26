package com.carepilot.repository.config;

import com.carepilot.domain.config.Scenario;
import com.carepilot.domain.config.ScenarioQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioQuestionRepository extends JpaRepository<ScenarioQuestion, Long> {
    List<ScenarioQuestion> findByScenarioOrderByQuestionOrderAsc(Scenario scenario);
    
    @Modifying
    @Query("DELETE FROM ScenarioQuestion q WHERE q.scenario = :scenario")
    void deleteByScenario(@Param("scenario") Scenario scenario);
}

