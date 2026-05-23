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
 * Stage 1 of ClassificationPipeline: download PDF from S3 and extract text via PDFBox 3.x.
 * Uses Loader.loadPDF(byte[]) — PDFBox 3.x API (NOT the deprecated PDDocument.load()).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PdfExtractionStage {

    private final StorageService storageService;

    @Value("${app.classification.min-char-count:100}")
    private int minCharCount;

    @Value("${app.classification.min-printable-ratio:0.85}")
    private double minPrintableRatio;

    /**
     * @return extracted text, or null if quality gate failed (extractionWarning set on classification)
     */
    public String extract(Classification classification) {
        try (InputStream is = storageService.getFile(classification.getFilePath())) {
            // PDFBox 3.x API: Loader.loadPDF() — NOT PDDocument.load()
            try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(doc);

                // Text quality gate: minimum character count
                if (text == null || text.length() < minCharCount) {
                    classification.setExtractionWarning("PDF text extraction returned empty or insufficient content");
                    return null;
                }

                // Text quality gate: printable character ratio (catch scanned images)
                long printableChars = text.chars().filter(c -> c >= 32 && c <= 126).count();
                double ratio = (double) printableChars / text.length();
                if (ratio < minPrintableRatio) {
                    classification.setExtractionWarning("PDF contains mostly non-printable characters — likely a scanned image");
                    return null;
                }

                // Store truncated preview (max 500 chars); never log full text to avoid PHI exposure
                classification.setTextPreview(text.substring(0, Math.min(500, text.length())));
                log.debug("PDF extracted: {} chars (preview stored)", text.length());
                return text;
            }
        } catch (Exception e) {
            log.error("PDF extraction failed for classification {}", classification.getId());
            classification.setExtractionWarning("PDF extraction failed: " + e.getMessage());
            return null;
        }
    }
}
