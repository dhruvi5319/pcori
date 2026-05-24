package com.pcori.platform.common.exception;

import com.pcori.platform.common.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> ErrorResponse.FieldError.builder()
                .field(e.getField())
                .message(e.getDefaultMessage())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/validation")
                .title("Validation Error")
                .status(400)
                .detail("One or more fields failed validation")
                .timestamp(Instant.now())
                .errors(fieldErrors)
                .build());
    }

    @ExceptionHandler(DomainExceptions.ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(DomainExceptions.ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/not-found")
                .title("Not Found")
                .status(404)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DomainExceptions.DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/conflict")
                .title("Conflict")
                .status(409)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(DomainExceptions.AccountLockedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/account-locked")
                .title("Account Locked")
                .status(403)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler({DomainExceptions.AccountInactiveException.class,
                        DomainExceptions.EmailNotVerifiedException.class})
    public ResponseEntity<ErrorResponse> handleForbidden(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/forbidden")
                .title("Forbidden")
                .status(403)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.InvalidTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidToken(DomainExceptions.InvalidTokenException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/invalid-token")
                .title("Invalid Token")
                .status(400)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/access-denied")
                .title("Access Denied")
                .status(403)
                .detail("Insufficient permissions")
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler({
        DomainExceptions.InvalidParentException.class,
        DomainExceptions.InvalidLevelException.class,
        DomainExceptions.CircularReferenceException.class,
        DomainExceptions.InactiveParentException.class
    })
    public ResponseEntity<ErrorResponse> handleTaxonomyValidation(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/taxonomy-validation")
                .title("Taxonomy Validation Error")
                .status(400)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.CodeDuplicateException.class)
    public ResponseEntity<ErrorResponse> handleCodeDuplicate(DomainExceptions.CodeDuplicateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/code-duplicate")
                .title("Duplicate Code")
                .status(409)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.InvalidStatusException.class)
    public ResponseEntity<ErrorResponse> handleInvalidStatus(DomainExceptions.InvalidStatusException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/invalid-status")
                .title("Invalid Status")
                .status(400)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.InvalidFileTypeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFileType(DomainExceptions.InvalidFileTypeException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/invalid-file-type")
                .title("Invalid File Type")
                .status(415)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.FileTooLargeException.class)
    public ResponseEntity<ErrorResponse> handleFileTooLarge(DomainExceptions.FileTooLargeException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/file-too-large")
                .title("File Too Large")
                .status(413)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.StorageUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleStorageUnavailable(DomainExceptions.StorageUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/storage-unavailable")
                .title("Storage Unavailable")
                .status(503)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(DomainExceptions.ClassificationException.class)
    public ResponseEntity<ErrorResponse> handleClassificationError(DomainExceptions.ClassificationException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/classification-failed")
                .title("Classification Failed")
                .status(422)
                .detail(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse.builder()
                .type("https://pcori.com/errors/internal")
                .title("Internal Server Error")
                .status(500)
                .detail("An unexpected error occurred")
                .timestamp(Instant.now())
                .build());
    }
}
