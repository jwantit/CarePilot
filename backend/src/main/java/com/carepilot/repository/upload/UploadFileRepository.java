package com.carepilot.repository.upload;

import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.file.UploadFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UploadFileRepository extends JpaRepository<UploadFile, Long> {

    @Query("SELECT uf FROM UploadFile uf " +
            "WHERE uf.careTarget.careTargetId = :careTargetId " +
            "AND uf.organization.organizationId = :organizationId " +
            "AND uf.targetType = :targetType")
    List<UploadFile> findByCareTargetAndType(
            @Param("careTargetId") Long careTargetId,
            @Param("organizationId") Long organizationId,
            @Param("targetType") UploadTargetType targetType
    );

    Optional<UploadFile> findFirstByStoragePath(String storagePath);

    @Query("SELECT uf FROM UploadFile uf WHERE uf.notice.noticeId = :noticeId")
    List<UploadFile> findByNoticeId(@Param("noticeId") Long noticeId);

}
