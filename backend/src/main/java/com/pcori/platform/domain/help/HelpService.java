package com.pcori.platform.domain.help;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.help.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class HelpService {

    private final HelpArticleRepository articleRepository;
    private final FaqRepository faqRepository;
    private final DocumentationFeedbackRepository feedbackRepository;

    // ---------------------------------------------------------------
    // Article operations
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<HelpArticleResponse> listArticles() {
        return articleRepository.findAllByOrderByPublishedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HelpArticleResponse getBySlug(String slug) {
        HelpArticle article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "Help article not found: " + slug));
        return toResponse(article);
    }

    @Transactional(readOnly = true)
    public List<HelpArticleResponse> searchArticles(String q) {
        // Enforce minimum 2 characters (FR-9.1 spec)
        if (q == null || q.trim().length() < 2) {
            throw new DomainExceptions.InvalidRequestException(
                    "Search query must be at least 2 characters");
        }
        return articleRepository.searchFullText(q.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Admin article CRUD

    public HelpArticleResponse createArticle(HelpArticleRequest req, UUID createdBy) {
        HelpArticle article = HelpArticle.builder()
                .title(req.title())
                .slug(req.slug())
                .category(req.category())
                .content(req.content())
                .createdBy(createdBy)
                .build();
        return toResponse(articleRepository.save(article));
    }

    public HelpArticleResponse updateArticle(UUID id, HelpArticleRequest req, UUID modifiedBy) {
        HelpArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "Help article not found: " + id));
        article.setTitle(req.title());
        article.setSlug(req.slug());
        article.setCategory(req.category());
        article.setContent(req.content());
        article.setLastModifiedBy(modifiedBy);
        return toResponse(articleRepository.save(article));
    }

    public void deleteArticle(UUID id) {
        HelpArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "Help article not found: " + id));
        article.setDeletedAt(Instant.now());
        articleRepository.save(article);
    }

    // ---------------------------------------------------------------
    // FAQ operations
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<FaqResponse> listFaqs(String category) {
        List<Faq> faqs = (category == null || category.isBlank())
                ? faqRepository.findAllByOrderByDisplayOrderAsc()
                : faqRepository.findByCategoryOrderByDisplayOrderAsc(category);
        return faqs.stream().map(this::toFaqResponse).toList();
    }

    // Admin FAQ CRUD

    public FaqResponse createFaq(FaqRequest req, UUID createdBy) {
        Faq faq = Faq.builder()
                .question(req.question())
                .answer(req.answer())
                .category(req.category())
                .displayOrder(req.displayOrder())
                .createdBy(createdBy)
                .build();
        return toFaqResponse(faqRepository.save(faq));
    }

    public FaqResponse updateFaq(UUID id, FaqRequest req) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "FAQ not found: " + id));
        faq.setQuestion(req.question());
        faq.setAnswer(req.answer());
        faq.setCategory(req.category());
        faq.setDisplayOrder(req.displayOrder());
        return toFaqResponse(faqRepository.save(faq));
    }

    public void deleteFaq(UUID id) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "FAQ not found: " + id));
        faq.setDeletedAt(Instant.now());
        faqRepository.save(faq);
    }

    // ---------------------------------------------------------------
    // Feedback operations
    // ---------------------------------------------------------------

    public FeedbackResponse submitFeedback(FeedbackRequest req, UUID userId) {
        // Check duplicate before attempting insert (belt-and-suspenders with DB constraint)
        if (feedbackRepository.existsByArticleIdAndUserId(req.articleId(), userId)) {
            throw new DomainExceptions.ConflictException("Already submitted feedback for this article");
        }

        DocumentationFeedback feedback = DocumentationFeedback.builder()
                .articleId(req.articleId())
                .userId(userId)
                .helpful(req.helpful())
                .comment(req.comment())
                .build();

        DocumentationFeedback saved;
        try {
            saved = feedbackRepository.save(feedback);
        } catch (DataIntegrityViolationException e) {
            // Belt-and-suspenders: handle race condition where duplicate check passed
            // but DB unique constraint triggers
            throw new DomainExceptions.ConflictException("Already submitted feedback for this article");
        }

        long helpfulCount = feedbackRepository.countByArticleIdAndHelpfulTrue(req.articleId());
        long notHelpfulCount = feedbackRepository.countByArticleIdAndHelpfulFalse(req.articleId());

        return new FeedbackResponse(
                saved.getId(),
                saved.getArticleId(),
                saved.getHelpful(),
                saved.getComment(),
                saved.getSubmittedAt(),
                helpfulCount,
                notHelpfulCount
        );
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getArticleFeedback(UUID articleId) {
        long helpfulCount = feedbackRepository.countByArticleIdAndHelpfulTrue(articleId);
        long notHelpfulCount = feedbackRepository.countByArticleIdAndHelpfulFalse(articleId);
        return new FeedbackResponse(null, articleId, false, null, null, helpfulCount, notHelpfulCount);
    }

    // ---------------------------------------------------------------
    // Mapping helpers
    // ---------------------------------------------------------------

    private HelpArticleResponse toResponse(HelpArticle a) {
        return new HelpArticleResponse(
                a.getId(),
                a.getTitle(),
                a.getSlug(),
                a.getCategory(),
                a.getContent(),
                a.getPublishedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private FaqResponse toFaqResponse(Faq f) {
        return new FaqResponse(
                f.getId(),
                f.getQuestion(),
                f.getAnswer(),
                f.getCategory(),
                f.getDisplayOrder(),
                f.getCreatedAt()
        );
    }
}
