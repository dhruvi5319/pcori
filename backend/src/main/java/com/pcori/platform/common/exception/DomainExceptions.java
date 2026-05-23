package com.pcori.platform.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

public class DomainExceptions {

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class DuplicateResourceException extends RuntimeException {
        public DuplicateResourceException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class AccountLockedException extends RuntimeException {
        private final long lockedUntilEpochMs;
        public AccountLockedException(String message, long lockedUntilEpochMs) {
            super(message);
            this.lockedUntilEpochMs = lockedUntilEpochMs;
        }
        public long getLockedUntilEpochMs() { return lockedUntilEpochMs; }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class AccountInactiveException extends RuntimeException {
        public AccountInactiveException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class EmailNotVerifiedException extends RuntimeException {
        public EmailNotVerifiedException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public static class StorageUnavailableException extends RuntimeException {
        public StorageUnavailableException(String message) { super(message); }
    }

    // ── Taxonomy domain exceptions ──────────────────────────────────────────

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class CodeDuplicateException extends RuntimeException {
        public CodeDuplicateException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class InvalidParentException extends RuntimeException {
        public InvalidParentException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class InvalidLevelException extends RuntimeException {
        public InvalidLevelException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class CircularReferenceException extends RuntimeException {
        public CircularReferenceException(String message) { super(message); }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class InactiveParentException extends RuntimeException {
        public InactiveParentException(String message) { super(message); }
    }
}
