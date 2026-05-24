package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.integration.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/**
 * Stage 1: Download PDF from S3 and extract text using PDFBox 3.x.
 * PDFBox 3.x API uses Loader.loadPDF() — NOT deprecated PDDocument.load().
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PdfExtractionStage {

    private final StorageService storageService;

    @Value("${app.classification.min-char-count:100}")
    private int minCharCount;

    @Value("${app.classification.min-printable-ratio:0.85}")
    private double minPrintableRatio;

    /**
     * Extract text from the PDF stored at classification.getFilePath().
     *
     * @return extracted text, or null if quality gate failed (extractionWarning is set on classification)
     */
    public String extract(Classification classification) {
        String filePath = classification.getFilePath();
        if (filePath == null || filePath.isBlank()) {
            classification.setExtractionWarning("No file path associated with this classification");
            return null;
        }

        try (InputStream is = storageService.getFile(filePath)) {
            // PDFBox 3.x: use Loader.loadPDF(byte[]) — stream must be fully read first
            byte[] bytes = is.readAllBytes();
            try (PDDocument doc = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(doc);

                // Quality gate 1: minimum character count
                if (text == null || text.trim().length() < minCharCount) {
                    classification.setExtractionWarning(
                        "PDF text extraction returned empty or insufficient content");
                    return null;
                }

                // Quality gate 2: printable character ratio (detects scanned images)
                long printableChars = text.chars()
                    .filter(c -> c >= 32 && c <= 126)
                    .count();
                double ratio = (double) printableChars / text.length();
                if (ratio < minPrintableRatio) {
                    classification.setExtractionWarning(
                        "PDF contains mostly non-printable characters — likely a scanned image");
                    return null;
                }

                // Store truncated preview (max 500 chars); never log full text
                classification.setTextPreview(text.substring(0, Math.min(500, text.length())));
                log.debug("PDF extracted: {} chars (preview stored, full text not logged)", text.length());
                return text;
            }
        } catch (Exception e) {
            log.error("PDF extraction failed for classification {}: {}",
                classification.getId(), e.getClass().getSimpleName());
            classification.setExtractionWarning("PDF extraction failed: " + e.getMessage());
            return null;
        }
    }
}
