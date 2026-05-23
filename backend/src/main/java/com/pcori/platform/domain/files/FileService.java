package com.pcori.platform.domain.files;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.files.dto.DownloadUrlResponse;
import com.pcori.platform.integration.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service("fileService")
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final UploadedFileRepository fileRepository;
    private final StorageService storageService;

    @Value("${PRE_SIGNED_URL_TTL_SECONDS:900}")
    private int presignedUrlTtlSeconds;

    /**
     * Store a multipart file upload to S3 and create UploadedFile record.
     * Storage key format: pdfs/{year}/{month}/{uuid}-{sanitizedFilename}.pdf
     */
    public UploadedFile storeFile(MultipartFile file, UUID uploadedBy) {
        String sanitizedFilename = sanitizeFilename(file.getOriginalFilename());
        String storageKey = buildStorageKey(sanitizedFilename);

        try {
            storageService.store(
                file.getInputStream(), storageKey,
                "application/pdf", file.getSize()
            );
        } catch (IOException e) {
            log.error("Failed to read uploaded file input stream", e);
            throw new DomainExceptions.StorageUnavailableException("Failed to read uploaded file");
        }

        UploadedFile record = new UploadedFile();
        record.setFilename(storageKey);
        record.setOriginalName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed.pdf");
        record.setContentType("application/pdf");
        record.setSize(file.getSize());
        record.setPath(storageKey);
        record.setUploadedBy(uploadedBy);
        return fileRepository.save(record);
    }

    /**
     * Generate a pre-signed download URL. Only uploader or ADMIN may request.
     * Pre-signed URL is NEVER stored or logged.
     */
    @PreAuthorize("@fileService.isOwnerOrAdmin(#id, authentication)")
    public DownloadUrlResponse getDownloadUrl(UUID id) {
        UploadedFile file = fileRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException("File not found: " + id));
        String url = storageService.getDownloadUrl(file.getPath(), presignedUrlTtlSeconds);
        return new DownloadUrlResponse(url, Instant.now().plusSeconds(presignedUrlTtlSeconds));
    }

    /**
     * Authorization helper used by @PreAuthorize SpEL expression.
     * Returns true if the authenticated user is the file owner or has ROLE_ADMIN.
     */
    public boolean isOwnerOrAdmin(UUID fileId, Authentication auth) {
        if (auth == null) return false;
        return fileRepository.findById(fileId)
            .map(f -> {
                boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (isAdmin) return true;
                // Compare uploadedBy UUID with principal's username (which stores the UUID string)
                if (auth.getPrincipal() instanceof UserDetails userDetails) {
                    return f.getUploadedBy().toString().equals(userDetails.getUsername());
                }
                return false;
            })
            .orElse(false);
    }

    /**
     * Get file content as InputStream for pipeline extraction.
     * Caller is responsible for closing the stream.
     */
    public InputStream getFileContent(String storageKey) {
        return storageService.getFile(storageKey);
    }

    /**
     * Builds S3 storage key: pdfs/{year}/{month}/{uuid}-{sanitizedFilename}
     */
    private String buildStorageKey(String sanitizedFilename) {
        LocalDate now = LocalDate.now();
        String uuid = UUID.randomUUID().toString();
        return String.format("pdfs/%d/%02d/%s-%s", now.getYear(), now.getMonthValue(), uuid, sanitizedFilename);
    }

    /**
     * Sanitize filename: remove path traversal characters, keep alphanumeric, dots, hyphens, underscores.
     */
    private String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) return "upload.pdf";
        // Remove path components, then sanitize characters
        String basename = original.contains("/") ? original.substring(original.lastIndexOf('/') + 1) : original;
        return basename.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\.{2,}", ".");
    }
}
