package com.pcori.platform.domain.files;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.files.dto.DownloadUrlResponse;
import com.pcori.platform.domain.user.User;
import com.pcori.platform.integration.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
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
     * Generate a pre-signed download URL. Pre-signed URL is NEVER stored or logged.
     */
    public DownloadUrlResponse getDownloadUrl(UUID id) {
        UploadedFile file = fileRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException("File not found: " + id));
        String url = storageService.getDownloadUrl(file.getPath(), presignedUrlTtlSeconds);
        return new DownloadUrlResponse(url, Instant.now().plusSeconds(presignedUrlTtlSeconds));
    }

    public boolean isOwnerOrAdmin(UUID fileId, Authentication auth) {
        return fileRepository.findById(fileId)
            .map(f -> {
                boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (isAdmin) return true;
                Object principal = auth.getPrincipal();
                if (principal instanceof User user) {
                    return f.getUploadedBy().equals(user.getId());
                }
                return false;
            })
            .orElse(false);
    }

    public InputStream getFileContent(String storageKey) {
        return storageService.getFile(storageKey);
    }

    private String buildStorageKey(String sanitizedFilename) {
        LocalDate now = LocalDate.now();
        String uuid = UUID.randomUUID().toString();
        return String.format("pdfs/%d/%02d/%s-%s", now.getYear(), now.getMonthValue(), uuid, sanitizedFilename);
    }

    private String sanitizeFilename(String original) {
        if (original == null) return "upload.pdf";
        return original.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\.+", ".");
    }
}
