package com.pcori.platform.domain.files;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, UUID> {

    /**
     * Find all non-deleted files uploaded by a given user.
     * The @SQLRestriction on UploadedFile ensures deleted_at IS NULL is applied automatically.
     */
    List<UploadedFile> findByUploadedBy(UUID userId);
}
