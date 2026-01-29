package com.carepilot.repository.caretarget;

import com.carepilot.domain.caretarget.CareTargetGroup;
import com.carepilot.domain.caretarget.CareTargetGroupMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CareTargetGroupMapRepository extends JpaRepository<CareTargetGroupMap, Long> {

    //케어그룹 리스트 조회------------------------------------------------
    @Query("SELECT m FROM CareTargetGroupMap m " +
            "JOIN FETCH m.group g " +
            "JOIN FETCH m.careTarget t " +
            "WHERE g.organization.organizationId = :organizationId " +
            "ORDER BY g.groupId DESC")
    List<CareTargetGroupMap> findAllGroupList(@Param("organizationId") Long organizationId);
    //-----------------------------------------------------------------



    //케어 그룹 상세보기------------------------------------------------------
    @Query("SELECT m FROM CareTargetGroupMap m " +
            "JOIN FETCH m.group g " +
            "JOIN FETCH m.careTarget t " +
            "WHERE g.organization.organizationId = :organizationId " +
            "AND g.groupId = :careTargetGroupId " +
            "ORDER BY g.groupId DESC")
    List<CareTargetGroupMap> findGroupDetails(
            @Param("organizationId") Long organizationId,
            @Param("careTargetGroupId") Long careTargetGroupId);
    //-----------------------------------------------------------------



    //그룹맵 삭제----------------------------------------------------------
    @Modifying
    @Transactional
    @Query("DELETE FROM CareTargetGroupMap m WHERE m.group.groupId = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);
    //-----------------------------------------------------------------

    //그룹맵 삭제----------------------------------------------------------
    // 특정 그룹 내에서 선택한 대상자들만 삭제하는 경우
    @Modifying
    @Transactional
    @Query("DELETE FROM CareTargetGroupMap m " +
            "WHERE m.group.groupId = :groupId " +
            "AND m.careTarget.careTargetId IN :careTargetIds")
    void deleteByGroupIdAndCareTargetIds(@Param("groupId") Long groupId,
                                         @Param("careTargetIds") List<Long> careTargetIds);
    //-----------------------------------------------------------------


    //삭제----------------------------------------------------------
    @Modifying
    @Transactional
    @Query("DELETE FROM CareTargetGroupMap m " +
            "WHERE m.careTarget.careTargetId IN :careTargetIds " +
            "AND m.careTarget.organization.organizationId = :organizationId")
    void deleteByCareTargetIds(@Param("careTargetIds") List<Long> careTargetIds,
                               @Param("organizationId") Long organizationId);



}
