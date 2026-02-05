package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTargetGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CareTargetGroupRepository extends JpaRepository<CareTargetGroup, Long> {


    //케대 그룹 리스트 전체조회
    @Query("SELECT g FROM CareTargetGroup g " +
            "WHERE g.organization.organizationId = :organizationId")
    List<CareTargetGroup> findAllByOrgId(@Param("organizationId") Long organizationId);


    @Modifying
    @Query("UPDATE CareTargetGroup ctg SET ctg.scenario = NULL WHERE ctg.scenario.scenarioId = :scenarioId")
    void clearScenarioByScenarioId(@Param("scenarioId") Long scenarioId);


}
