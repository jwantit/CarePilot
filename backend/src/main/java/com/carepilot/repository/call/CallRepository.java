package com.carepilot.repository.call;

import com.carepilot.domain.call.Call;
import com.carepilot.domain.call.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CallRepository extends JpaRepository<Call, Long> {

    // 통화 이력 최신순 조회
    List<Call> findAllByOrderByStartTimeDesc();

    // 조직별 통화 이력 최신순 조회
    List<Call> findByOrganizationOrganizationIdOrderByStartTimeDesc(Long organizationId);

    //케어 대상자 리스트 조회 가장 최근 값 하나
    @Query("SELECT c FROM Call c WHERE c.careTarget.careTargetId = :careTargetId ORDER BY c.startTime DESC LIMIT 1")
    Optional<Call> findTopByCareTargetId(@Param("careTargetId") Long careTargetId);

    //케어 대상자 상세보기 통화기록
    List<Call> findAllByCareTargetCareTargetIdOrderByStartTimeDesc(Long careTargetId);

    // Twilio CallSid로 Call 조회
    Optional<Call> findByCallSid(String callSid);

    // 통계 쿼리들
    @Query("SELECT COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate")
    Long countByOrganizationIdAndDateRange(@Param("organizationId") Long organizationId,
                                            @Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.status = :status AND c.startTime >= :startDate AND c.startTime < :endDate")
    Long countByOrganizationIdAndStatusAndDateRange(@Param("organizationId") Long organizationId,
                                                     @Param("status") CallStatus status,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(c.duration) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.status = 'SUCCESS' AND c.duration IS NOT NULL " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate")
    Double avgDurationByOrganizationIdAndDateRange(@Param("organizationId") Long organizationId,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.status, COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate " +
           "GROUP BY c.status")
    List<Object[]> countByOrganizationIdAndStatusGrouped(@Param("organizationId") Long organizationId,
                                                          @Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.direction, COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate " +
           "GROUP BY c.direction")
    List<Object[]> countByOrganizationIdAndDirectionGrouped(@Param("organizationId") Long organizationId,
                                                             @Param("startDate") LocalDateTime startDate,
                                                             @Param("endDate") LocalDateTime endDate);

    @Query(value = "SELECT HOUR(c.start_time) as hour, COUNT(c.call_id) as count FROM calls c " +
           "WHERE c.organization_id = :organizationId " +
           "AND c.start_time >= :startDate AND c.start_time < :endDate " +
           "GROUP BY HOUR(c.start_time)", nativeQuery = true)
    List<Object[]> countByOrganizationIdAndHourGrouped(@Param("organizationId") Long organizationId,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);

    @Query(value = "SELECT DATE(c.start_time) as date, COUNT(c.call_id) as total, " +
           "SUM(CASE WHEN c.status = 'SUCCESS' THEN 1 ELSE 0 END) as success, " +
           "SUM(CASE WHEN c.status = 'FAILED' THEN 1 ELSE 0 END) as failed, " +
           "SUM(CASE WHEN c.status = 'NO_ANSWER' THEN 1 ELSE 0 END) as no_answer " +
           "FROM calls c WHERE c.organization_id = :organizationId " +
           "AND c.start_time >= :startDate AND c.start_time < :endDate " +
           "GROUP BY DATE(c.start_time) ORDER BY DATE(c.start_time)", nativeQuery = true)
    List<Object[]> getDailyTrend(@Param("organizationId") Long organizationId,
                                 @Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate")
    List<Call> findByOrganizationIdAndDateRange(@Param("organizationId") Long organizationId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);
    
    // 필터 적용: CareTarget ID 목록과 질환으로 필터링
    @Query("SELECT c FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate " +
           "AND (:careTargetIds IS NULL OR c.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR c.careTarget.disease = :disease)")
    List<Call> findByOrganizationIdAndDateRangeWithFilters(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);
    
    // 필터 적용: 통계용 카운트
    @Query("SELECT COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate " +
           "AND (:careTargetIds IS NULL OR c.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR c.careTarget.disease = :disease)")
    Long countByOrganizationIdAndDateRangeWithFilters(
            @Param("organizationId") Long organizationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);
    
    // 필터 적용: 상태별 카운트
    @Query("SELECT COUNT(c) FROM Call c WHERE c.organization.organizationId = :organizationId " +
           "AND c.status = :status AND c.startTime >= :startDate AND c.startTime < :endDate " +
           "AND (:careTargetIds IS NULL OR c.careTarget.careTargetId IN :careTargetIds) " +
           "AND (:disease IS NULL OR :disease = '' OR c.careTarget.disease = :disease)")
    Long countByOrganizationIdAndStatusAndDateRangeWithFilters(
            @Param("organizationId") Long organizationId,
            @Param("status") CallStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("careTargetIds") List<Long> careTargetIds,
            @Param("disease") String disease);
}
