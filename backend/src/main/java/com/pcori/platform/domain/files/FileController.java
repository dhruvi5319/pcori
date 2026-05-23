package com.pcori.platform.domain.files;

import com.pcori.platform.domain.files.dto.DownloadUrlResponse;
import com.pcori.platform.domain.files.dto.FileMetadataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for file operations.
 * Upload is handled by ClassificationController (plan 04) which chains into FileService.
 * This controller exposes download URL generation and admin metadata viewing.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * GET /api/files/{id}/download-url
     * Returns a 15-minute pre-signed S3 URL for temporary download access.
     * Authorization: owner or ADMIN (enforced by @PreAuthorize in FileService).
     */
    @GetMapping("/{id}/download-url")
    public ResponseEntity<DownloadUrlResponse> getDownloadUrl(@PathVariable UUID id) {
        return ResponseEntity.ok(fileService.getDownloadUrl(id));
    }

    /**
     * GET /api/files/{id}
     * Returns file metadata (no URL). ADMIN only.
     * Full implementation deferred to Phase 4 (admin management layer).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FileMetadataResponse> getFileMetadata(@PathVariable UUID id) {
        // Placeholder: ADMIN metadata view is Phase 4
        throw new UnsupportedOperationException("Admin metadata view not implemented in Phase 2 — see Phase 4");
    }
}
