package com.pcori.platform.domain.auth;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.auth.dto.*;
import com.pcori.platform.domain.user.*;
import com.pcori.platform.domain.user.dto.*;
import com.pcori.platform.integration.email.EmailService;
import com.pcori.platform.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(noRollbackFor = {
    org.springframework.security.authentication.BadCredentialsException.class,
    com.pcori.platform.common.exception.DomainExceptions.AccountLockedException.class,
    com.pcori.platform.common.exception.DomainExceptions.EmailNotVerifiedException.class,
    com.pcori.platform.common.exception.DomainExceptions.AccountInactiveException.class
})
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.auth.max-login-attempts:5}")
    private int maxLoginAttempts;

    @Value("${app.auth.lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;

    @Value("${app.auth.password-reset-ttl-minutes:60}")
    private int passwordResetTtlMinutes;

    // FR-1.1: Registration
    public UserRegisteredResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DomainExceptions.DuplicateResourceException(
                "USERNAME_TAKEN: Username already in use");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DomainExceptions.DuplicateResourceException(
                "EMAIL_TAKEN: Email already registered");
        }

        UUID verificationToken = UUID.randomUUID();

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .isActive(false)              // inactive until email verified
            .isEmailVerified(false)
            .emailVerificationToken(verificationToken)
            .loginAttempts(0)
            .build();

        // Assign default REVIEWER role to all self-registered users
        roleRepository.findByName("REVIEWER").ifPresent(role -> user.getRoles().add(role));

        User saved = userRepository.save(user);

        // Send verification email asynchronously
        emailService.sendVerificationEmail(
            saved.getEmail(), saved.getFirstName(), verificationToken.toString());

        return UserRegisteredResponse.builder()
            .id(saved.getId().toString())
            .username(saved.getUsername())
            .email(saved.getEmail())
            .firstName(saved.getFirstName())
            .lastName(saved.getLastName())
            .createdAt(saved.getCreatedAt())
            .build();
    }

    // FR-1.2: Login with FR-1.3 lockout logic
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException(
                "INVALID_CREDENTIALS"));

        // FR-1.3: Check lockout first
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            long remainingMs = user.getLockedUntil().toEpochMilli() - System.currentTimeMillis();
            long remainingMins = (remainingMs / 60_000) + 1;
            throw new DomainExceptions.AccountLockedException(
                String.format("Account locked. Try again after %d minutes.", remainingMins),
                user.getLockedUntil().toEpochMilli());
        }

        // Check account status
        if (!user.isActive()) {
            throw new DomainExceptions.AccountInactiveException(
                "ACCOUNT_INACTIVE: Account is deactivated");
        }
        if (!user.isEmailVerified()) {
            throw new DomainExceptions.EmailNotVerifiedException(
                "EMAIL_NOT_VERIFIED: Please verify your email before logging in");
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // FR-1.3: Increment failed attempts
            user.setLoginAttempts(user.getLoginAttempts() + 1);
            if (user.getLoginAttempts() >= maxLoginAttempts) {
                user.setLockedUntil(Instant.now().plus(lockoutDurationMinutes, ChronoUnit.MINUTES));
                log.warn("Account locked for user: {} after {} failed attempts",
                    user.getUsername(), maxLoginAttempts);
            }
            userRepository.save(user);
            throw new org.springframework.security.authentication.BadCredentialsException(
                "INVALID_CREDENTIALS");
        }

        // Success: reset attempts, update last login
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtService.generateToken(user.getUsername(), user.getRoleNames());
        String refreshTokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(refreshTokenValue)
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .revoked(false)
            .build();
        refreshTokenRepository.save(refreshToken);

        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshTokenValue)
            .expiresIn(jwtService.getExpirationMs())
            .user(LoginResponse.UserSummary.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoleNames())
                .build())
            .build();
    }

    // FR-1.6: Logout
    public void logout(String username) {
        userRepository.findByUsername(username).ifPresent(user ->
            refreshTokenRepository.revokeAllUserTokens(user.getId()));
    }

    // FR-1.4: Forgot password (always returns 200 — prevents email enumeration)
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            UUID resetToken = UUID.randomUUID();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetExpiresAt(
                Instant.now().plus(passwordResetTtlMinutes, ChronoUnit.MINUTES));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(
                user.getEmail(), user.getFirstName(), resetToken.toString());
        });
        // Always returns successfully — no information about whether email exists
    }

    // FR-1.4: Reset password
    public void resetPassword(ResetPasswordRequest request) {
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(request.getToken());
        } catch (IllegalArgumentException e) {
            throw new DomainExceptions.InvalidTokenException(
                "INVALID_TOKEN: Reset token is invalid or expired");
        }

        User user = userRepository.findByPasswordResetToken(tokenUuid)
            .orElseThrow(() -> new DomainExceptions.InvalidTokenException(
                "INVALID_TOKEN: Reset token is invalid or expired"));

        if (user.getPasswordResetExpiresAt() == null ||
                user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            throw new DomainExceptions.InvalidTokenException(
                "INVALID_TOKEN: Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
    }

    // FR-1.5: Verify email
    public void verifyEmail(String token) {
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(token);
        } catch (IllegalArgumentException e) {
            throw new DomainExceptions.InvalidTokenException(
                "INVALID_TOKEN: Verification token is invalid or expired");
        }

        User user = userRepository.findByEmailVerificationToken(tokenUuid)
            .orElseThrow(() -> new DomainExceptions.InvalidTokenException(
                "INVALID_TOKEN: Verification token is invalid or expired"));

        user.setEmailVerified(true);
        user.setActive(true);    // activate account on email verification
        user.setEmailVerificationToken(null);
        userRepository.save(user);
    }

    // FR-1.2: Token refresh
    @Transactional
    public LoginResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository
            .findByTokenAndRevokedFalse(refreshTokenValue)
            .orElseThrow(() -> new DomainExceptions.InvalidTokenException(
                "TOKEN_INVALID: Refresh token is invalid or expired"));

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new DomainExceptions.InvalidTokenException(
                "TOKEN_INVALID: Refresh token has expired");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getUsername(), user.getRoleNames());

        return LoginResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshTokenValue)  // same refresh token
            .expiresIn(jwtService.getExpirationMs())
            .user(LoginResponse.UserSummary.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoleNames())
                .build())
            .build();
    }
}
