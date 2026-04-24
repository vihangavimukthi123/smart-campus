package com.smartcampus.incident.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.enabled:true}")
    private boolean isEnabled;

    public void sendOtpEmail(String toEmail, String otp) {
        // Email feature off
        if (!isEnabled) {
            log.info("Email service is disabled. OTP was: {}", otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom("SmartCampus Admin <" + fromEmail + ">");
        message.setTo(toEmail);
        message.setSubject("Account Verification Code - SmartCampus");
        
        message.setText("Welcome to SmartCampus!\n\n" +
                        "Your verification code is: " + otp + "\n\n" +
                        "Please use this code to complete your registration. " +
                        "This code will expire in 5 minutes.\n\n" +
                        "If you did not request this, please ignore this email.");

        try {
            mailSender.send(message);
            log.info("Email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            // Error handling - log the error
            log.error("CRITICAL: Failed to send OTP email to {}", toEmail, e);
        }
    }

    public void sendSimpleEmail(String to, String subject, String body) {
        if (!isEnabled) {
            log.info("Email service is disabled. Message to {}: {}", to, body);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("SmartCampus Admin <" + fromEmail + ">");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            log.info("Notification email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send notification email to {}. Error: {}", to, e.getMessage());
        }
    }
}