package com.pcori.platform.common.util;

import com.pcori.platform.common.exception.DomainExceptions;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Validates uploaded files using Apache Tika for MIME detection (not extension-only).
 */
@Component
public class FileValidator {

    @Value("${MAX_UPLOAD_SIZE_MB:50}")
    private int maxUploadSizeMb;

    public void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new DomainExceptions.InvalidFileTypeException("No file provided");
        }

        // MIME type detection via Tika (not extension-based)
        try (InputStream is = file.getInputStream()) {
            Tika tika = new Tika();
            String mimeType = tika.detect(is, file.getOriginalFilename());
            if (!"application/pdf".equals(mimeType)) {
                throw new DomainExceptions.InvalidFileTypeException(
                    "Only PDF files are accepted. Detected type: " + mimeType);
            }
        } catch (IOException e) {
            throw new DomainExceptions.InvalidFileTypeException("Could not read uploaded file");
        }

        // Size check
        if (file.getSize() > getMaxUploadSizeBytes()) {
            throw new DomainExceptions.FileTooLargeException(
                "File exceeds maximum allowed size of " + maxUploadSizeMb + " MB");
        }
    }

    private long getMaxUploadSizeBytes() {
        return (long) maxUploadSizeMb * 1024 * 1024;
    }
}
