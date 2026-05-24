package com.pcori.platform.domain.files;

import com.pcori.platform.domain.files.dto.DownloadUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * GET /api/files/{id}/download-url
     * Returns a 15-minute pre-signed URL for the given file.
     * Accessible by any authenticated user (ownership check done in service).
     */
    @GetMapping("/{id}/download-url")
    public ResponseEntity<DownloadUrlResponse> getDownloadUrl(@PathVariable UUID id) {
        return ResponseEntity.ok(fileService.getDownloadUrl(id));
    }
}
