package com.pcori.platform.domain.report;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationSpecification;
import com.pcori.platform.domain.classification.dto.ClassificationFilters;
import com.pcori.platform.domain.report.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for report generation, template management, and filter preview.
 *
 * <p>Async generation pattern: {@link #startGeneration} creates the ExcelReport record
 * with GENERATING status and returns immediately (202). The actual Excel generation runs
 * asynchronously on the classificationExecutor thread pool via {@link #runGenerationAsync}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportService {

    private final ExcelReportRepository excelReportRepository;
    private final ReportConfigurationRepository reportConfigurationRepository;
    private final ClassificationRepository classificationRepository;
    private final ExcelGenerationService excelGenerationService;
    private final ObjectMapper objectMapper;

    // ── Excel generation ─────────────────────────────────────────────────────

    /**
     * FR-6.1: Start async Excel generation. Returns 202 immediately.
     * If configurationId is provided, columns/filters are loaded from the template.
     */
    public ExcelReportResponse startGeneration(ExcelGenerateRequest req, UUID ownerId) {
        List<String> columns = req.columns() != null ? req.columns() : Collections.emptyList();
        String filtersJson = req.filtersJson() != null ? req.filtersJson() : "{}";

        // If template referenced, use its columns/filters as defaults
        if (req.configurationId() != null) {
            ReportConfiguration template = reportConfigurationRepository.findById(req.configurationId())
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                    "Report template not found: " + req.configurationId()));
            if (columns.isEmpty()) {
                columns = parseColumnsList(template.getColumns());
            }
            if ("{}".equals(filtersJson) && template.getFilters() != null) {
                filtersJson = template.getFilters();
            }
        }

        ExcelReport report = new ExcelReport();
        report.setConfigurationId(req.configurationId());
        report.setStatus(ReportStatus.GENERATING);
        ExcelReport saved = excelReportRepository.save(report);

        // Launch async generation
        final List<String> finalColumns = columns;
        final String finalFiltersJson = filtersJson;
        runGenerationAsync(saved.getId(), finalColumns, finalFiltersJson);

        log.info("Excel report {} queued for async generation (configId={})",
            saved.getId(), req.configurationId());

        return toExcelReportResponse(saved);
    }

    /**
     * Async method: generates Excel file and updates ExcelReport status.
     * Runs on the classificationExecutor thread pool.
     *
     * Uses REQUIRES_NEW so status updates are committed even if caller transaction rolls back.
     */
    @Async("classificationExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void runGenerationAsync(UUID reportId, List<String> columns, String filtersJson) {
        ExcelReport report = excelReportRepository.findById(reportId)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "ExcelReport not found: " + reportId));
        try {
            byte[] bytes = excelGenerationService.generateExcel(columns, filtersJson);

            // Store to temp file (production: replace with StorageService)
            Path tempFile = Files.createTempFile("report-" + reportId + "-", ".xlsx");
            Files.write(tempFile, bytes);
            String filePath = tempFile.toAbsolutePath().toString();

            report.setStatus(ReportStatus.READY);
            report.setGeneratedAt(Instant.now());
            report.setFilePath(filePath);
            excelReportRepository.save(report);

            log.info("Excel report {} generation complete, path={}", reportId, filePath);
        } catch (Exception e) {
            log.error("Excel report {} generation failed", reportId, e);
            report.setStatus(ReportStatus.FAILED);
            report.setErrorMessage(e.getMessage());
            excelReportRepository.save(report);
        }
    }

    /**
     * FR-6.2: Download generated Excel file bytes.
     * Returns file content for streaming to client.
     */
    @Transactional(readOnly = true)
    public byte[] downloadReport(UUID reportId) {
        ExcelReport report = excelReportRepository.findById(reportId)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Excel report not found: " + reportId));

        if (report.getStatus() != ReportStatus.READY) {
            throw new DomainExceptions.InvalidRequestException(
                "Report " + reportId + " is not ready for download (status=" + report.getStatus() + ")");
        }

        if (report.getFilePath() == null) {
            throw new DomainExceptions.ResourceNotFoundException(
                "Report file not available for: " + reportId);
        }

        try {
            return Files.readAllBytes(Path.of(report.getFilePath()));
        } catch (Exception e) {
            log.error("Failed to read report file {}: {}", report.getFilePath(), e.getMessage());
            throw new DomainExceptions.StorageUnavailableException(
                "Could not read report file: " + e.getMessage());
        }
    }

    /**
     * FR-6.4: Preview — returns row count and up to 3 sample rows matching filters.
     */
    @Transactional(readOnly = true)
    public PreviewResponse getPreview(String filtersJson, List<String> columns) {
        ClassificationFilters filters = excelGenerationService.parseFilters(filtersJson);
        Specification<Classification> spec = ClassificationSpecification.withFilters(filters);

        long totalCount = classificationRepository.count(spec);
        List<Classification> samples = classificationRepository.findAll(spec, PageRequest.of(0, 3)).getContent();

        List<Map<String, Object>> sampleRows = samples.stream()
            .map(c -> toSampleRow(c, columns))
            .toList();

        return new PreviewResponse(totalCount, sampleRows);
    }

    /**
     * List all Excel reports (admin/reviewer view — all reports).
     */
    @Transactional(readOnly = true)
    public List<ExcelReportResponse> listReports() {
        return excelReportRepository.findAll().stream()
            .map(this::toExcelReportResponse)
            .toList();
    }

    /**
     * Get a single Excel report by ID.
     */
    @Transactional(readOnly = true)
    public ExcelReportResponse getReport(UUID reportId) {
        return toExcelReportResponse(excelReportRepository.findById(reportId)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Excel report not found: " + reportId)));
    }

    // ── Report template (ReportConfiguration) management ──────────────────────

    /**
     * FR-6.3: Save a named report template linked to the current user.
     */
    public ReportConfigResponse createTemplate(ReportConfigRequest req, UUID ownerId) {
        if (reportConfigurationRepository.existsByOwnerIdAndName(ownerId, req.name())) {
            throw new DomainExceptions.DuplicateResourceException(
                "A report template named '" + req.name() + "' already exists");
        }

        ReportConfiguration config = new ReportConfiguration();
        config.setOwnerId(ownerId);
        config.setName(req.name());
        config.setColumns(columnsToJson(req.columns()));
        config.setFilters(req.filtersJson() != null ? req.filtersJson() : "{}");

        return toReportConfigResponse(reportConfigurationRepository.save(config));
    }

    /**
     * List all templates owned by the given user.
     */
    @Transactional(readOnly = true)
    public List<ReportConfigResponse> listTemplates(UUID ownerId) {
        return reportConfigurationRepository.findByOwnerIdAndDeletedAtIsNull(ownerId).stream()
            .map(this::toReportConfigResponse)
            .toList();
    }

    /**
     * Update a report template (name, columns, filters). Owner must match.
     */
    public ReportConfigResponse updateTemplate(UUID id, ReportConfigRequest req, UUID ownerId) {
        ReportConfiguration config = findTemplateByOwner(id, ownerId);

        // Name uniqueness: allow same name for update (exclude self)
        if (!config.getName().equals(req.name())
                && reportConfigurationRepository.existsByOwnerIdAndName(ownerId, req.name())) {
            throw new DomainExceptions.DuplicateResourceException(
                "A report template named '" + req.name() + "' already exists");
        }

        config.setName(req.name());
        config.setColumns(columnsToJson(req.columns()));
        config.setFilters(req.filtersJson() != null ? req.filtersJson() : "{}");

        return toReportConfigResponse(reportConfigurationRepository.save(config));
    }

    /**
     * Soft-delete a report template. Owner must match.
     */
    public void deleteTemplate(UUID id, UUID ownerId) {
        ReportConfiguration config = findTemplateByOwner(id, ownerId);
        config.setDeletedAt(Instant.now());
        reportConfigurationRepository.save(config);
    }

    /**
     * Run a saved template: load columns/filters and start async generation.
     */
    public ExcelReportResponse runTemplate(UUID templateId, UUID ownerId) {
        ReportConfiguration template = findTemplateByOwner(templateId, ownerId);
        ExcelGenerateRequest req = new ExcelGenerateRequest(
            parseColumnsList(template.getColumns()),
            template.getFilters(),
            templateId
        );
        return startGeneration(req, ownerId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ReportConfiguration findTemplateByOwner(UUID id, UUID ownerId) {
        ReportConfiguration config = reportConfigurationRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Report template not found: " + id));
        if (!ownerId.equals(config.getOwnerId())) {
            throw new DomainExceptions.ResourceNotFoundException(
                "Report template not found: " + id);
        }
        return config;
    }

    private ExcelReportResponse toExcelReportResponse(ExcelReport r) {
        return new ExcelReportResponse(
            r.getId(),
            r.getConfigurationId(),
            r.getStatus() != null ? r.getStatus().name() : null,
            r.getGeneratedAt(),
            r.getFilePath(),
            r.getErrorMessage(),
            r.getCreatedAt()
        );
    }

    private ReportConfigResponse toReportConfigResponse(ReportConfiguration c) {
        return new ReportConfigResponse(
            c.getId(),
            c.getName(),
            parseColumnsList(c.getColumns()),
            c.getFilters(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }

    @SuppressWarnings("unchecked")
    private List<String> parseColumnsList(String columnsJson) {
        if (columnsJson == null || columnsJson.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(columnsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Could not parse columns JSON: {}", columnsJson);
            return Collections.emptyList();
        }
    }

    private String columnsToJson(List<String> columns) {
        if (columns == null) return "[]";
        try {
            return objectMapper.writeValueAsString(columns);
        } catch (Exception e) {
            return "[]";
        }
    }

    private Map<String, Object> toSampleRow(Classification c, List<String> columns) {
        Map<String, Object> row = new LinkedHashMap<>();
        List<String> cols = (columns == null || columns.isEmpty())
            ? ExcelGenerationService.ALL_COLUMNS
            : columns;
        for (String col : cols) {
            row.put(col, extractColumnValueAsObject(c, col));
        }
        return row;
    }

    private Object extractColumnValueAsObject(Classification c, String columnName) {
        return switch (columnName) {
            case "Plan ID"          -> c.getPlanId();
            case "Title"            -> c.getTitle();
            case "Status"           -> c.getStatus() != null ? c.getStatus().name() : null;
            case "PCC"              -> c.getPcc();
            case "Taxonomy Category"-> c.getTaxonomyCategory();
            case "Code"             -> c.getTaxonomyCode();
            case "Subcode"          -> c.getTaxonomySubcode();
            case "AI Confidence"    -> c.getConfidenceScore();
            case "Uploaded By"      -> c.getUploadedBy();
            case "Upload Date"      -> c.getUploadedAt();
            case "Classified Date"  -> c.getClassifiedAt();
            case "Reviewed By"      -> c.getReviewedBy();
            case "Override Reason"  -> c.getOverrideReason();
            default                 -> null;
        };
    }
}
