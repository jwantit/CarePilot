package com.carepilot.repository.call;

import com.carepilot.domain.call.Call;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CallRepository extends JpaRepository<Call, Long> {










    //케어 대상자 리스트 조회 가장 최근 값 하나
    @Query("SELECT c FROM Call c WHERE c.careTarget.careTargetId = :careTargetId ORDER BY c.startTime DESC LIMIT 1")
    Optional<Call> findTopByCareTargetId(@Param("careTargetId") Long careTargetId);

    //케어 대상자 상세보기 통화기록
    @Query("SELECT c FROM Call c WHERE c.careTarget.careTargetId = :careTargetId ORDER BY c.startTime DESC")
    List<Call> findAllByCareTargetId(@Param("careTargetId") Long careTargetId);

}
