package com.pcori.platform.domain.classification;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.common.util.FileValidator;
import com.pcori.platform.domain.classification.dto.*;
import com.pcori.platform.domain.classification.pipeline.ClassificationPipeline;
import com.pcori.platform.domain.files.FileService;
import com.pcori.platform.domain.files.UploadedFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClassificationService {

    private final ClassificationRepository classificationRepository;
    private final FileService fileService;
    private final FileValidator fileValidator;
    private final PlanIdGenerator planIdGenerator;
    private final ClassificationPipeline pipeline;

    /**
     * FR-2.1/2.3: Upload PDF and kick off async classification pipeline.
     * Returns immediately with 202; pipeline runs asynchronously.
     */
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN')")
    public UploadResponse uploadAndClassify(MultipartFile file, String title, String notes, UUID uploadedBy) {
        fileValidator.validatePdf(file);

        // Store file in S3
        UploadedFile uploadedFile = fileService.storeFile(file, uploadedBy);

        // Create classification record
        String planId = planIdGenerator.next();
        Classification classification = new Classification();
        classification.setPlanId(planId);
        classification.setTitle(title != null && !title.isBlank() ? title : file.getOriginalFilename());
        classification.setNotes(notes);
        classification.setStatus(ClassificationStatus.PENDING);
        classification.setUploadedBy(uploadedBy);
        classification.setFileId(uploadedFile.getId());
        classification.setFileName(uploadedFile.getOriginalName());
        classification.setFileSize(uploadedFile.getSize());
        classification.setFilePath(uploadedFile.getPath());
        Classification saved = classificationRepository.save(classification);

        // Fire async pipeline — returns immediately
        pipeline.process(saved.getId());
        log.info("Classification {} created with planId {}, pipeline started async", saved.getId(), planId);

        return new UploadResponse(saved.getId(), planId, ClassificationStatus.PENDING, saved.getUploadedAt());
    }

    /**
     * FR-2.6: Apply manual override to any taxonomy dimension.
     */
    @PreAuthorize("hasAnyRole('REVIEWER', 'PROGRAM_MANAGER', 'ADMIN')")
    public Classification applyOverride(UUID id, ManualOverrideRequest req, UUID reviewedBy) {
        if (req.overrideReason() == null || req.overrideReason().isBlank()) {
            throw new DomainExceptions.ValidationException("Override reason is required");
        }
        Classification c = getById(id);
        if (req.pcc() != null) c.setPcc(req.pcc());
        if (req.taxonomyCategory() != null) c.setTaxonomyCategory(req.taxonomyCategory());
        if (req.taxonomyCode() != null) c.setTaxonomyCode(req.taxonomyCode());
        if (req.taxonomySubcode() != null) c.setTaxonomySubcode(req.taxonomySubcode());
        c.setOverrideReason(req.overrideReason());
        c.setReviewedBy(reviewedBy);
        c.setReviewedAt(Instant.now());
        c.setStatus(ClassificationStatus.CLASSIFIED);
        return classificationRepository.save(c);
    }

    /**
     * FR-2.7: Retry a FAILED classification.
     */
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN')")
    public Classification retry(UUID id) {
        Classification c = getById(id);
        if (c.getStatus() != ClassificationStatus.FAILED) {
            throw new DomainExceptions.InvalidStatusException(
                "Retry is only available for FAILED classifications. Current status: " + c.getStatus());
        }
        c.setStatus(ClassificationStatus.PENDING);
        c.setErrorMessage(null);
        c.setExtractionWarning(null);
        Classification saved = classificationRepository.save(c);
        pipeline.process(saved.getId());
        log.info("Classification {} retry initiated", id);
        return saved;
    }

    /**
     * FR-2.8: List classifications with filters and pagination.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('REVIEWER', 'PROGRAM_MANAGER', 'ADMIN', 'VIEWER')")
    public Page<Classification> list(ClassificationFilters filters, Pageable pageable) {
        return classificationRepository.findAll(ClassificationSpecification.withFilters(filters), pageable);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('REVIEWER', 'PROGRAM_MANAGER', 'ADMIN', 'VIEWER')")
    public Classification getById(UUID id) {
        return classificationRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Classification " + id + " not found"));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('PROGRAM_MANAGER', 'ADMIN')")
    public ClassificationStats getStatistics() {
        return classificationRepository.getStatistics();
    }
}
