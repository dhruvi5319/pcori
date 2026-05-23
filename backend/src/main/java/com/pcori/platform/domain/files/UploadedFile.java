package com.pcori.platform.domain.files;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity mapped to the uploaded_files table.
 * Tracks every file stored in S3-compatible storage (MinIO in dev, S3 in prod).
 * Soft-deleted via deleted_at column; @SQLRestriction filters deleted records automatically.
 */
@Entity
@Table(name = "uploaded_files")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class UploadedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** S3 object key — the authoritative storage location. */
    @Column(name = "filename", nullable = false, length = 500)
    private String filename;

    /** Original filename from user upload — for display only. */
    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /** File size in bytes. */
    @Column(name = "size", nullable = false)
    private Long size;

    /** S3 object key (same as filename for v1). */
    @Column(name = "path", nullable = false, length = 500)
    private String path;

    /** FK to users.id — stored as UUID, not a JPA join, to avoid circular loading. */
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
