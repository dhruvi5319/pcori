package com.pcori.platform.integration.email;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String firstName, String token);
    void sendPasswordResetEmail(String toEmail, String firstName, String token);
}
