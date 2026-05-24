package com.pcori.platform.domain.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationSpecification;
import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.domain.classification.dto.ClassificationFilters;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Generates Excel files from classification data.
 *
 * <p>Memory strategy:
 * <ul>
 *   <li>≤1000 rows → {@link XSSFWorkbook} (in-memory, supports cell styles + formatting)</li>
 *   <li>&gt;1000 rows → {@link SXSSFWorkbook}(500) (streaming, 500-row flush window — prevents OOM)</li>
 * </ul>
 *
 * <p>Column order per UX spec (FR-6.1):
 * Plan ID | Title | Status | PCC | Taxonomy Category | Code | Subcode |
 * AI Confidence | Uploaded By | Upload Date | Classified Date | Reviewed By | Override Reason
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelGenerationService {

    private static final int STREAMING_THRESHOLD = 1000;
    private static final int SXSSF_WINDOW = 500;

    /** Canonical column order from UX spec (FR-6.1). */
    static final List<String> ALL_COLUMNS = List.of(
        "Plan ID",
        "Title",
        "Status",
        "PCC",
        "Taxonomy Category",
        "Code",
        "Subcode",
        "AI Confidence",
        "Uploaded By",
        "Upload Date",
        "Classified Date",
        "Reviewed By",
        "Override Reason"
    );

    private final ClassificationRepository classificationRepository;
    private final ObjectMapper objectMapper;

    /**
     * Generates Excel file bytes from classification data matching the given filters.
     *
     * @param selectedColumns column names to include (ordered subset of ALL_COLUMNS)
     * @param filtersJson     JSON string with filter criteria, or null for all records
     * @return Excel file bytes (.xlsx)
     */
    public byte[] generateExcel(List<String> selectedColumns, String filtersJson) throws IOException {
        // 1. Parse filters
        ClassificationFilters filters = parseFilters(filtersJson);

        // 2. Query all matching classifications (no pagination — full export)
        Specification<Classification> spec = ClassificationSpecification.withFilters(filters);
        List<Classification> rows = classificationRepository.findAll(spec);
        int rowCount = rows.size();

        log.info("Generating Excel report: {} rows, {} columns, streaming={}",
            rowCount, selectedColumns.size(), rowCount > STREAMING_THRESHOLD);

        // 3. Determine ordered output columns (only selected, in canonical order)
        List<String> orderedColumns = ALL_COLUMNS.stream()
            .filter(col -> selectedColumns == null || selectedColumns.isEmpty() || selectedColumns.contains(col))
            .toList();

        // 4. Choose workbook type based on row count
        if (rowCount > STREAMING_THRESHOLD) {
            return generateStreamingExcel(rows, orderedColumns);
        } else {
            return generateInMemoryExcel(rows, orderedColumns);
        }
    }

    // ── In-memory path (≤1000 rows) ─────────────────────────────────────────

    private byte[] generateInMemoryExcel(List<Classification> rows, List<String> columns) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Classifications");
            CellStyle headerStyle = createHeaderStyle(workbook);

            writeHeaderRow(sheet, columns, headerStyle);
            writeDataRows(sheet, rows, columns, 1);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ── Streaming path (>1000 rows) ──────────────────────────────────────────

    private byte[] generateStreamingExcel(List<Classification> rows, List<String> columns) throws IOException {
        // SXSSFWorkbook(500): keeps at most 500 rows in memory at a time; flushes to temp file
        SXSSFWorkbook workbook = new SXSSFWorkbook(SXSSF_WINDOW);
        workbook.setCompressTempFiles(true);
        try {
            Sheet sheet = workbook.createSheet("Classifications");
            // SXSSF does not support full cell styles on streamed rows — use basic header
            CellStyle headerStyle = createHeaderStyle(workbook);

            writeHeaderRow(sheet, columns, headerStyle);
            writeDataRows(sheet, rows, columns, 1);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } finally {
            // Dispose temporary files created by SXSSF
            workbook.dispose();
            workbook.close();
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private void writeHeaderRow(Sheet sheet, List<String> columns, CellStyle headerStyle) {
        Row header = sheet.createRow(0);
        for (int i = 0; i < columns.size(); i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(columns.get(i));
            cell.setCellStyle(headerStyle);
        }
    }

    private void writeDataRows(Sheet sheet, List<Classification> rows, List<String> columns, int startRow) {
        int rowIdx = startRow;
        for (Classification c : rows) {
            Row row = sheet.createRow(rowIdx++);
            for (int colIdx = 0; colIdx < columns.size(); colIdx++) {
                Cell cell = row.createCell(colIdx);
                String value = extractColumnValue(c, columns.get(colIdx));
                cell.setCellValue(value != null ? value : "");
            }
        }
    }

    /**
     * Maps a column name (per UX spec) to the corresponding Classification field value.
     */
    private String extractColumnValue(Classification c, String columnName) {
        return switch (columnName) {
            case "Plan ID"          -> c.getPlanId();
            case "Title"            -> c.getTitle();
            case "Status"           -> c.getStatus() != null ? c.getStatus().name() : null;
            case "PCC"              -> c.getPcc();
            case "Taxonomy Category"-> c.getTaxonomyCategory();
            case "Code"             -> c.getTaxonomyCode();
            case "Subcode"          -> c.getTaxonomySubcode();
            case "AI Confidence"    -> c.getConfidenceScore() != null
                                           ? c.getConfidenceScore().toPlainString()
                                           : null;
            case "Uploaded By"      -> c.getUploadedBy() != null ? c.getUploadedBy().toString() : null;
            case "Upload Date"      -> c.getUploadedAt() != null ? c.getUploadedAt().toString() : null;
            case "Classified Date"  -> c.getClassifiedAt() != null ? c.getClassifiedAt().toString() : null;
            case "Reviewed By"      -> c.getReviewedBy() != null ? c.getReviewedBy().toString() : null;
            case "Override Reason"  -> c.getOverrideReason();
            default -> null;
        };
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    /**
     * Parse JSON filter string into ClassificationFilters.
     * Supports keys: status, startDate, endDate, pcc, q.
     * Returns empty filters if filtersJson is null or blank.
     */
    @SuppressWarnings("unchecked")
    ClassificationFilters parseFilters(String filtersJson) {
        if (filtersJson == null || filtersJson.isBlank() || "{}".equals(filtersJson.trim())) {
            return new ClassificationFilters(null, null, null, null, null);
        }
        try {
            Map<String, Object> map = objectMapper.readValue(filtersJson, Map.class);

            ClassificationStatus status = null;
            if (map.get("status") instanceof String s && !s.isBlank()) {
                try {
                    status = ClassificationStatus.valueOf(s);
                } catch (IllegalArgumentException ignored) {
                    log.warn("Unknown classification status filter value: {}", s);
                }
            }

            LocalDate startDate = parseDate(map.get("startDate"));
            LocalDate endDate = parseDate(map.get("endDate"));
            String pcc = map.get("pcc") instanceof String p ? p : null;
            String q = map.get("q") instanceof String query ? query : null;

            return new ClassificationFilters(status, startDate, endDate, pcc, q);
        } catch (Exception e) {
            log.warn("Failed to parse filtersJson, using empty filters: {}", e.getMessage());
            return new ClassificationFilters(null, null, null, null, null);
        }
    }

    private LocalDate parseDate(Object value) {
        if (value instanceof String s && !s.isBlank()) {
            try {
                return LocalDate.parse(s);
            } catch (Exception ignored) {
                log.warn("Could not parse date filter value: {}", s);
            }
        }
        return null;
    }
}
