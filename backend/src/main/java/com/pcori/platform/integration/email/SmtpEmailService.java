package com.pcori.platform.integration.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.mail.from:noreply@pcori.local}")
    private String fromAddress;

    @Override
    @Async
    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("Verify your PCORI Analytics account");
            message.setText(String.format(
                "Hi %s,%n%nPlease verify your email by clicking the link below:%n%n%s/verify-email?token=%s%n%n" +
                "This link is single-use. If you did not create an account, please ignore this email.%n%nPCORI Analytics Team",
                firstName, frontendUrl, token));
            mailSender.send(message);
            log.info("Verification email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("Reset your PCORI Analytics password");
            message.setText(String.format(
                "Hi %s,%n%nClick the link below to reset your password:%n%n%s/reset-password?token=%s%n%n" +
                "This link expires in 60 minutes and is single-use. If you did not request this, please ignore this email.%n%nPCORI Analytics Team",
                firstName, frontendUrl, token));
            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }
}
