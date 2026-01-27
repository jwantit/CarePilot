package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CareTargetRepository extends JpaRepository<CareTarget, Long> {

    //케어 대상자 검색 과 필터
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

    @Query("SELECT c FROM CareTarget c " +
            "WHERE c.careTargetId = :careTargetId " +
            "AND (:filter IS NULL OR c.careStatus = :filter)")
    Optional<CareTarget> findCareTargetWithFilter(
            @Param("careTargetId") Long careTargetId,
            @Param("filter") Boolean filter
    );


    //케어 그룹 생성시 필요한 케데 리스트
    @Query("SELECT new com.carepilot.dto.caretarget.CareTargetListResponseDTO(" +
            "c.careTargetId, c.name, c.age, c.gender, c.disease, " +
            "(SELECT rs.riskLevel FROM RiskScore rs WHERE rs.careTarget.id = c.id ORDER BY rs.createdAt DESC LIMIT 1)) " +
            "FROM CareTarget c " +
            "WHERE c.organization.id = :organizationId " +
            "AND (:filter IS NULL OR c.careStatus = :filter)")
    List<CareTargetListResponseDTO> findCareTargetList(
            @Param("organizationId") Long organizationId,
            @Param("filter") Boolean filter
    );


}


