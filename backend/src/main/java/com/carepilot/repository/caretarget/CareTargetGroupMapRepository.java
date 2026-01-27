package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CareTargetGroupMapRepository extends JpaRepository<CareTargetGroupMap, Long> {

    @Query("SELECT m FROM CareTargetGroupMap m " +
            "JOIN FETCH m.group g " +
            "JOIN FETCH m.careTarget t " +
            "WHERE g.organization.organizationId = :organizationId " +
            "ORDER BY g.groupId DESC")
    List<CareTargetGroupMap> findAllGroupDetails(@Param("organizationId") Long organizationId);
}
