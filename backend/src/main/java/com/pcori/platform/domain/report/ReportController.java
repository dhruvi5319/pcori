package com.pcori.platform.domain.report;

import com.pcori.platform.domain.report.dto.*;
import com.pcori.platform.domain.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Excel report generation, download, templates, and preview.
 *
 * Endpoints (from TechArch spec):
 * <pre>
 * POST   /api/excel/generate              → 202 ExcelReportResponse (async start)
 * GET    /api/reports                     → 200 List&lt;ExcelReportResponse&gt;
 * POST   /api/reports                     → 201 ReportConfigResponse (template alias)
 * GET    /api/reports/{id}               → 200 ExcelReportResponse
 * GET    /api/reports/{id}/download      → 200 byte[] (Content-Disposition: attachment)
 * GET    /api/reports/templates          → 200 List&lt;ReportConfigResponse&gt;
 * POST   /api/reports/templates          → 201 ReportConfigResponse
 * PUT    /api/reports/templates/{id}     → 200 ReportConfigResponse
 * DELETE /api/reports/templates/{id}     → 204
 * POST   /api/reports/templates/{id}/run → 202 ExcelReportResponse
 * GET    /api/reports/preview            → 200 PreviewResponse
 * </pre>
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    // ── /api/excel endpoints ──────────────────────────────────────────────────

    /**
     * POST /api/excel/generate
     * Starts async Excel generation; returns 202 immediately with report ID.
     */
    @PostMapping("/api/excel/generate")
    public ResponseEntity<ExcelReportResponse> generate(
            @RequestBody ExcelGenerateRequest req,
            @AuthenticationPrincipal User principal) {
        ExcelReportResponse response = reportService.startGeneration(req, principal.getId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    // ── /api/reports endpoints ────────────────────────────────────────────────

    /**
     * GET /api/reports
     * List all Excel reports.
     */
    @GetMapping("/api/reports")
    public ResponseEntity<List<ExcelReportResponse>> listReports() {
        return ResponseEntity.ok(reportService.listReports());
    }

    /**
     * POST /api/reports
     * Create a report template (alias for POST /api/reports/templates).
     */
    @PostMapping("/api/reports")
    public ResponseEntity<ReportConfigResponse> createReport(
            @Valid @RequestBody ReportConfigRequest req,
            @AuthenticationPrincipal User principal) {
        ReportConfigResponse response = reportService.createTemplate(req, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/reports/preview
     * Returns row count and 3 sample Classification rows matching the filters.
     * NOTE: Must be declared before /{id} to avoid path conflict.
     */
    @GetMapping("/api/reports/preview")
    public ResponseEntity<PreviewResponse> getPreview(
            @RequestParam(required = false, defaultValue = "{}") String filtersJson,
            @RequestParam(required = false) List<String> columns) {
        return ResponseEntity.ok(reportService.getPreview(filtersJson, columns));
    }

    /**
     * GET /api/reports/templates
     * List all report templates owned by the current user.
     * NOTE: Must be declared before /{id} to avoid path conflict.
     */
    @GetMapping("/api/reports/templates")
    public ResponseEntity<List<ReportConfigResponse>> listTemplates(
            @AuthenticationPrincipal User principal) {
        return ResponseEntity.ok(reportService.listTemplates(principal.getId()));
    }

    /**
     * POST /api/reports/templates
     * Create a new report template.
     */
    @PostMapping("/api/reports/templates")
    public ResponseEntity<ReportConfigResponse> createTemplate(
            @Valid @RequestBody ReportConfigRequest req,
            @AuthenticationPrincipal User principal) {
        ReportConfigResponse response = reportService.createTemplate(req, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/reports/templates/{id}
     * Update a report template.
     */
    @PutMapping("/api/reports/templates/{id}")
    public ResponseEntity<ReportConfigResponse> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody ReportConfigRequest req,
            @AuthenticationPrincipal User principal) {
        return ResponseEntity.ok(reportService.updateTemplate(id, req, principal.getId()));
    }

    /**
     * DELETE /api/reports/templates/{id}
     * Soft-delete a report template.
     */
    @DeleteMapping("/api/reports/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable UUID id,
            @AuthenticationPrincipal User principal) {
        reportService.deleteTemplate(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/reports/templates/{id}/run
     * Run a saved template: starts async generation with template columns/filters.
     */
    @PostMapping("/api/reports/templates/{id}/run")
    public ResponseEntity<ExcelReportResponse> runTemplate(
            @PathVariable UUID id,
            @AuthenticationPrincipal User principal) {
        ExcelReportResponse response = reportService.runTemplate(id, principal.getId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * GET /api/reports/{id}
     * Get a single Excel report by ID.
     */
    @GetMapping("/api/reports/{id}")
    public ResponseEntity<ExcelReportResponse> getReport(@PathVariable UUID id) {
        return ResponseEntity.ok(reportService.getReport(id));
    }

    /**
     * GET /api/reports/{id}/download
     * FR-6.2: Download generated Excel file.
     * Returns byte[] with Content-Disposition: attachment header.
     * Content-Disposition is already in CORS exposedHeaders (SecurityConfig).
     */
    @GetMapping("/api/reports/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable UUID id) {
        byte[] bytes = reportService.downloadReport(id);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"report-" + id + ".xlsx\"")
            .body(bytes);
    }
}
