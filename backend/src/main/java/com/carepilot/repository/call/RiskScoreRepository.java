package com.carepilot.repository.call;

import com.carepilot.domain.call.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {

    // 특정 통화 건에 대한 위험도 점수 조회 (복수 건일 수 있으므로 최신 1건만)
    Optional<RiskScore> findFirstByCall_CallIdOrderByCalculatedAtDesc(Long callId);

    //케어 대상자 리스트 단일 조회
    @Query("SELECT rs FROM RiskScore rs " +
            "WHERE rs.careTarget.careTargetId = :careTargetId " +
            "ORDER BY rs.calculatedAt DESC LIMIT 1")
    Optional<RiskScore> findLatestByCareTargetId(@Param("careTargetId") Long careTargetId);

    //케어 대상자 리스트 배치 조회 - 여러 대상자의 최신 RiskScore 한 번에 조회
    @Query("SELECT rs FROM RiskScore rs " +
           "WHERE rs.careTarget.careTargetId IN :careTargetIds " +
           "AND rs.id IN (" +
           "   SELECT MAX(rs2.id) FROM RiskScore rs2 " +
           "   WHERE rs2.careTarget.careTargetId IN :careTargetIds " +
           "   GROUP BY rs2.careTarget.careTargetId" +
           ")")
    List<RiskScore> findLatestRiskScoresByCareTargetIds(@Param("careTargetIds") List<Long> careTargetIds);


    //케어 대상자 상세보기 위험 추이
    @Query("SELECT rs FROM RiskScore rs " +
            "WHERE rs.careTarget.careTargetId = :careTargetId " +
            "AND rs.calculatedAt >= :threeMonthsAgo " +
            "ORDER BY rs.calculatedAt ASC")
    List<RiskScore> findTrendData(
            @Param("careTargetId") Long careTargetId,
            @Param("threeMonthsAgo") LocalDateTime threeMonthsAgo
    );
    
    // 통계용 쿼리들
    @Query("SELECT AVG(rs.riskScore) FROM RiskScore rs " +
           "WHERE rs.organization.organizationId = :organizationId " +
           "AND rs.calculatedAt >= :startDate AND rs.calculatedAt < :endDate " +
           "AND rs.riskScore IS NOT NULL")
    Double avgRiskScoreByOrganizationIdAndDateRange(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT rs.riskLevel, COUNT(DISTINCT rs.careTarget.careTargetId) FROM RiskScore rs " +
           "WHERE rs.organization.organizationId = :organizationId " +
           "AND rs.calculatedAt >= :startDate AND rs.calculatedAt < :endDate " +
           "AND rs.riskLevel IS NOT NULL " +
           "GROUP BY rs.riskLevel")
    List<Object[]> countRiskLevelDistribution(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT DATE(rs.calculated_at) as date, AVG(rs.risk_score) as avg_score FROM risk_score rs " +
           "WHERE rs.organization_id = :organizationId " +
           "AND rs.calculated_at >= :startDate AND rs.calculated_at < :endDate " +
           "AND rs.risk_score IS NOT NULL " +
           "GROUP BY DATE(rs.calculated_at) ORDER BY DATE(rs.calculated_at)", nativeQuery = true)
    List<Object[]> getRiskScoreTrend(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    // 필터 적용: 위험 환자 수
    @Query("SELECT COUNT(DISTINCT rs.careTarget.careTargetId) FROM RiskScore rs " +
           "WHERE rs.organization.organizationId = :organizationId " +
           "AND rs.riskLevel IN ('HIGH', 'CRITICAL') " +
           "AND rs.calculatedAt >= :startDate AND rs.calculatedAt < :endDate " +
           "AND (:careTargetIds IS NULL OR rs.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR rs.careTarget.disease = :disease)")
    Long countRiskPatientsWithFilters(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);
    
    // 필터 적용: 평균 위험 점수
    @Query("SELECT AVG(rs.riskScore) FROM RiskScore rs " +
           "WHERE rs.organization.organizationId = :organizationId " +
           "AND rs.calculatedAt >= :startDate AND rs.calculatedAt < :endDate " +
           "AND rs.riskScore IS NOT NULL " +
           "AND (:careTargetIds IS NULL OR rs.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR rs.careTarget.disease = :disease)")
    Double avgRiskScoreByOrganizationIdAndDateRangeWithFilters(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);
}
