package com.example.studentclubbooking.service;

import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Mock Email Notification Service
 * In production, replace with JavaMailSender or a service like SendGrid/AWS SES.
 */
@Service
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    public void sendRegistrationConfirmation(User user, Event event, String transactionId) {
        // Mock: log the email instead of sending
        logger.info("📧 [EMAIL MOCK] Sending registration confirmation to: {}", user.getEmail());
        logger.info("   Subject: Registration Confirmed - {}", event.getTitle());
        logger.info("   Body: Dear {}, your registration for '{}' on {} is confirmed.", 
                user.getName(), event.getTitle(), event.getDate());
        logger.info("   Transaction ID: {}", transactionId);
        logger.info("   Amount Paid: ₹{}", event.getPrice());
        // In production: mailSender.send(buildConfirmationEmail(user, event, transactionId));
    }

    public void sendPaymentFailureNotification(User user, Event event) {
        logger.info("📧 [EMAIL MOCK] Sending payment failure notification to: {}", user.getEmail());
        logger.info("   Subject: Payment Failed - {}", event.getTitle());
        logger.info("   Body: Dear {}, your payment for '{}' failed. Please try again.", 
                user.getName(), event.getTitle());
        // In production: mailSender.send(buildFailureEmail(user, event));
    }

    public void sendWelcomeEmail(User user) {
        logger.info("📧 [EMAIL MOCK] Sending welcome email to: {}", user.getEmail());
        logger.info("   Subject: Welcome to Student Club & Workshop Hub!");
        logger.info("   Body: Dear {}, welcome! Explore and register for exciting events.", user.getName());
    }
}
