package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.dto.caretarget.CareTargetListResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CareTargetRepository extends JpaRepository<CareTarget, Long> {

    //케어 대상자 검색 과 필터
    @Query("SELECT c FROM CareTarget c " +
            "WHERE c.organization.organizationId = :organizationId " +
            "AND (:keyword IS NULL OR :keyword = '' " +
            "    OR c.name LIKE %:keyword% " +
            "    OR c.targetPhone LIKE %:keyword% " +
            "    OR c.disease LIKE %:keyword%) " +
            "ORDER BY c.careTargetId DESC")
    List<CareTarget> findByOrganizationIdAndFilterAndKeyword(
            @Param("organizationId") Long organizationId,
            @Param("keyword") String keyword
    );

    @Query("SELECT c FROM CareTarget c " +
            "WHERE c.careTargetId = :careTargetId ")
    Optional<CareTarget> findCareTargetWithFilter(
            @Param("careTargetId") Long careTargetId
    );

    //케어 그룹 생성시 필요한 케데 리스트
    @Query("SELECT new com.carepilot.dto.caretarget.CareTargetListResponseDTO(" +
            "c.careTargetId, c.name, c.age, c.gender, c.disease, " +
            "(SELECT rs.riskLevel FROM RiskScore rs WHERE rs.careTarget.id = c.id ORDER BY rs.createdAt DESC LIMIT 1)) " +
            "FROM CareTarget c " +
            "WHERE c.organization.id = :organizationId ")
    List<CareTargetListResponseDTO> findCareTargetList(
            @Param("organizationId") Long organizationId
    );

    @Query("SELECT ct.careTargetId FROM CareTarget ct WHERE ct.organization.organizationId = :organizationId")
    List<Long> findIdsByOrganizationId(@Param("organizationId") Long organizationId);
    
    // 통계용: 위험 환자 수 (최신 위험 점수가 특정 레벨 이상인 환자)
    @Query("SELECT COUNT(DISTINCT rs.careTarget.careTargetId) FROM RiskScore rs " +
           "WHERE rs.organization.organizationId = :organizationId " +
           "AND rs.riskLevel IN ('HIGH', 'CRITICAL') " +
           "AND rs.calculatedAt >= :startDate AND rs.calculatedAt < :endDate")
    Long countRiskPatients(@Param("organizationId") Long organizationId,
                          @Param("startDate") java.time.LocalDateTime startDate,
                          @Param("endDate") java.time.LocalDateTime endDate);
    
    // 통계용: 질환 목록 조회
    @Query("SELECT DISTINCT c.disease FROM CareTarget c " +
           "WHERE c.organization.organizationId = :organizationId " +
           "AND c.disease IS NOT NULL AND c.disease != ''")
    List<String> findDistinctDiseases(@Param("organizationId") Long organizationId);

    @Query("SELECT c.name FROM CareTarget c WHERE c.careTargetId = :careTargetId AND c.deletedAt IS NULL")
    String findNameByCareTargetId(@Param("careTargetId") Long careTargetId);


    @Modifying
    @Query("UPDATE CareTarget ct SET ct.doctor = NULL WHERE ct.doctor.doctorId = :doctorId")
    void clearCareTargetDoctor(@Param("doctorId") Long doctorId);


}


