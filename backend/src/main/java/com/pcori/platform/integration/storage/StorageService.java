package com.pcori.platform.integration.storage;

import java.io.InputStream;

public interface StorageService {

    /**
     * Upload file to S3-compatible storage.
     *
     * @param inputStream File content stream
     * @param storageKey  S3 object key (e.g., "pdfs/2026/05/{uuid}-filename.pdf")
     * @param contentType MIME type
     * @param sizeBytes   File size in bytes
     * @return The storage key (same as input storageKey)
     */
    String store(InputStream inputStream, String storageKey, String contentType, long sizeBytes);

    /**
     * Generate a pre-signed URL for temporary download access.
     *
     * @param storageKey S3 object key
     * @param ttlSeconds URL validity period (default 900 = 15 minutes)
     * @return Pre-signed URL string; never store or log this
     */
    String getDownloadUrl(String storageKey, int ttlSeconds);

    /**
     * Get file content as InputStream for pipeline extraction.
     */
    InputStream getFile(String storageKey);

    /**
     * Soft-delete: log intent for future cleanup.
     */
    void delete(String storageKey);
}
