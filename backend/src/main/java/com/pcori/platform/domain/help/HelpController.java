package com.pcori.platform.domain.help;

import com.pcori.platform.domain.help.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpService helpService;

    // ---------------------------------------------------------------
    // Article endpoints — READ (all authenticated users)
    // ---------------------------------------------------------------

    /** GET /api/help/articles — list all published articles */
    @GetMapping("/articles")
    public ResponseEntity<List<HelpArticleResponse>> listArticles() {
        return ResponseEntity.ok(helpService.listArticles());
    }

    /**
     * GET /api/help/articles/search?q= — full-text search
     * IMPORTANT: Declared BEFORE /articles/{slug} to prevent Spring resolving "search" as a slug.
     */
    @GetMapping("/articles/search")
    public ResponseEntity<List<HelpArticleResponse>> searchArticles(@RequestParam String q) {
        return ResponseEntity.ok(helpService.searchArticles(q));
    }

    /** GET /api/help/articles/{slug} — get article by slug */
    @GetMapping("/articles/{slug}")
    public ResponseEntity<HelpArticleResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(helpService.getBySlug(slug));
    }

    /** GET /api/help/articles/{id}/feedback — article feedback stats */
    @GetMapping("/articles/{id}/feedback")
    public ResponseEntity<FeedbackResponse> getArticleFeedback(@PathVariable UUID id) {
        return ResponseEntity.ok(helpService.getArticleFeedback(id));
    }

    // ---------------------------------------------------------------
    // Article endpoints — WRITE (ADMIN only)
    // ---------------------------------------------------------------

    /** POST /api/help/articles — create article */
    @PostMapping("/articles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HelpArticleResponse> createArticle(
            @Valid @RequestBody HelpArticleRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(helpService.createArticle(req, userId));
    }

    /** PUT /api/help/articles/{id} — update article */
    @PutMapping("/articles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HelpArticleResponse> updateArticle(
            @PathVariable UUID id,
            @Valid @RequestBody HelpArticleRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(helpService.updateArticle(id, req, userId));
    }

    /** DELETE /api/help/articles/{id} — soft-delete article */
    @DeleteMapping("/articles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteArticle(@PathVariable UUID id) {
        helpService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------------
    // FAQ endpoints — READ (all authenticated users)
    // ---------------------------------------------------------------

    /** GET /api/help/faqs?category= — list FAQs, optionally filtered by category */
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqResponse>> listFaqs(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(helpService.listFaqs(category));
    }

    // ---------------------------------------------------------------
    // FAQ endpoints — WRITE (ADMIN only)
    // ---------------------------------------------------------------

    /** POST /api/help/faqs — create FAQ */
    @PostMapping("/faqs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FaqResponse> createFaq(
            @Valid @RequestBody FaqRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(helpService.createFaq(req, userId));
    }

    /** PUT /api/help/faqs/{id} — update FAQ */
    @PutMapping("/faqs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FaqResponse> updateFaq(
            @PathVariable UUID id,
            @Valid @RequestBody FaqRequest req) {
        return ResponseEntity.ok(helpService.updateFaq(id, req));
    }

    /** DELETE /api/help/faqs/{id} — soft-delete FAQ */
    @DeleteMapping("/faqs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFaq(@PathVariable UUID id) {
        helpService.deleteFaq(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------------
    // Feedback endpoint (all authenticated users)
    // ---------------------------------------------------------------

    /** POST /api/help/feedback — submit documentation feedback; 409 if duplicate */
    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @Valid @RequestBody FeedbackRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(helpService.submitFeedback(req, userId));
    }
}
