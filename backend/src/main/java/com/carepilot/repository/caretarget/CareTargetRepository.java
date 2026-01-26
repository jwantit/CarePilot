package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CareTargetRepository extends JpaRepository<CareTarget, Long> {

    @Query("SELECT c FROM CareTarget c " +
            "WHERE c.organization.organizationId = :organizationId " +
            "AND (:filter IS NULL OR c.careStatus = :filter) " +
            "AND (:keyword IS NULL OR :keyword = '' " +
            "    OR c.name LIKE %:keyword% " +
            "    OR c.targetPhone LIKE %:keyword% " +
            "    OR c.disease LIKE %:keyword%) " +
            "ORDER BY c.careTargetId DESC")
    List<CareTarget> findByOrganizationIdAndFilterAndKeyword(
            @Param("organizationId") Long organizationId,
            @Param("filter") Boolean filter,
            @Param("keyword") String keyword
    );

}


