package com.carepilot.repository.call;

import com.carepilot.domain.call.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {













    //케어 대상자 리스트 단일 조회
    @Query("SELECT rs FROM RiskScore rs " +
            "WHERE rs.careTarget.careTargetId = :careTargetId " +
            "ORDER BY rs.calculatedAt DESC LIMIT 1")
    Optional<RiskScore> findLatestByCareTargetId(@Param("careTargetId") Long careTargetId);


    //케어 대상자 상세보기 위험 추이
    @Query("SELECT rs FROM RiskScore rs " +
            "WHERE rs.careTarget.careTargetId = :careTargetId " +
            "AND rs.calculatedAt >= :threeMonthsAgo " +
            "ORDER BY rs.calculatedAt ASC")
    List<RiskScore> findTrendData(
            @Param("careTargetId") Long careTargetId,
            @Param("threeMonthsAgo") LocalDateTime threeMonthsAgo
    );
}
