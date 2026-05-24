package com.pcori.platform.domain.pipeline;

import com.pcori.platform.domain.pipeline.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pipeline")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineStatusService pipelineStatusService;

    // ────────────────────────────────────────────────────────────────
    // Query endpoints — accessible to all authenticated users
    // ────────────────────────────────────────────────────────────────

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PipelineStatusDto> getStatus() {
        return ResponseEntity.ok(pipelineStatusService.getStatus());
    }

    @GetMapping("/health")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PipelineStageDto>> getHealth() {
        return ResponseEntity.ok(pipelineStatusService.getHealth());
    }

    @GetMapping("/{id}/stages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PipelineStageDto>> getStages(@PathVariable UUID id) {
        return ResponseEntity.ok(pipelineStatusService.getHealth());
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PipelineLogDto>> getLogs(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(pipelineStatusService.getLogs(id, pageable));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PipelineRunDto>> getHistory(
            @PathVariable UUID id,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(pipelineStatusService.getHistory(pageable));
    }

    @GetMapping("/connections")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DbHealthDto> getConnections() {
        return ResponseEntity.ok(pipelineStatusService.getDbHealth());
    }

    // ────────────────────────────────────────────────────────────────
    // Control endpoints — ADMIN only
    // ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> start(@PathVariable UUID id) {
        pipelineStatusService.start(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/stop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> stop(@PathVariable UUID id) {
        pipelineStatusService.stop(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/pause")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> pause(@PathVariable UUID id) {
        pipelineStatusService.pause(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/resume")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resume(@PathVariable UUID id) {
        pipelineStatusService.resume(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/stages/{stageId}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> retryStage(@PathVariable UUID id, @PathVariable String stageId) {
        pipelineStatusService.retryStage(id, stageId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> syncNow() {
        return ResponseEntity.ok(pipelineStatusService.syncNow());
    }
}
