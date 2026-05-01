package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.notification.NotificationResponse;
import com.smartcampus.incident.entity.Notification;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.NotificationRepository;
import com.smartcampus.incident.service.NotificationService;
import com.smartcampus.incident.util.SecurityUtils;
import com.smartcampus.incident.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final SecurityUtils securityUtils;

    // 1. state change in ticket
    @Override
    @Transactional
    public void notifyStatusChange(Long ticketId, User recipient, String newStatus) {
        String message = "Your ticket #" + ticketId + " status has been updated to: " + newStatus;
        saveAndSend(recipient, message, "STATUS_CHANGE", ticketId);
    }

    // 2. new comment added to ticket 
    @Override
    @Transactional
    public void notifyNewComment(Long ticketId, User recipient, String commenterName) {
        String message = commenterName + " added a new comment to your ticket #" + ticketId;
        saveAndSend(recipient, message, "NEW_COMMENT", ticketId);
    }

    @Override
    @Transactional
    public void notifyAssignment(Long ticketId, User technician, String ticketTitle) {
        String message = "New ticket assigned to you: " + ticketTitle;
        saveAndSend(technician, message, "ASSIGNMENT", ticketId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyNewTicket(Long ticketId, User admin, String ticketTitle) {

        String message = "New incident reported: " + ticketTitle;
        saveAndSend(admin, message, "NEW_TICKET", ticketId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyNewBooking(Long bookingId, User admin, String resourceName, String userName) {
        String message = String.format("New booking request #%d for %s by %s", bookingId, resourceName, userName);
        saveAndSend(admin, message, "NEW_BOOKING", bookingId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyBookingStatusUpdate(Long bookingId, User recipient, String status, String resourceName, String reason) {
        String message;
        if ("APPROVED".equalsIgnoreCase(status)) {
            message = String.format("Your booking #%d for %s has been APPROVED.", bookingId, resourceName);
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            message = String.format("Your booking #%d for %s has been REJECTED. Reason: %s", bookingId, resourceName, reason);
        } else if ("CANCELLED".equalsIgnoreCase(status)) {
            message = String.format("Booking #%d for %s has been CANCELLED.", bookingId, resourceName);
        } else {
            message = String.format("Your booking #%d for %s status updated to: %s", bookingId, resourceName, status);
        }
        saveAndSend(recipient, message, "BOOKING_STATUS", bookingId);
    }

    
    private void saveAndSend(User recipient, String message, String type, Long relatedId) {
        try {
            // Fetch fresh user from DB to ensure it's managed in the current transaction
            User managedRecipient = securityUtils.getUserByEmail(recipient.getEmail());
            
            // save to DB
            Notification notification = Notification.builder()
                    .recipient(managedRecipient)
                    .message(message)
                    .type(type)
                    .relatedId(relatedId) // use the parameter name
                    .read(false)
                    .build();
            notificationRepository.save(notification);
            log.info("✅ Notification saved successfully: recipient={}, type={}, relatedId={}", 
                     managedRecipient.getEmail(), type, relatedId);

            // send email notifications if user has enabled email notifications
            if (managedRecipient.isEmailNotify()) {
                emailService.sendSimpleEmail(managedRecipient.getEmail(), "SmartCampus Update", message);
            }
        } catch (Exception e) {
            log.error("❌ CRITICAL: Failed to save or send notification: {}", e.getMessage(), e);
            // We don't rethrow here because notifications shouldn't crash the main flow
        }
    }

    @Override
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        try {
            User currentUser = securityUtils.getCurrentUser();
            return notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser, pageable)
                    .map(this::convertToResponse);
        } catch (Exception e) {
            log.error("❌ ERROR fetching notifications: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User currentUser = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndRecipient(notificationId, currentUser)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setRead(true);
        return convertToResponse(notificationRepository.save(notification));
    }

    @Override
    public long getUnreadCount() {
        try {
            User currentUser = securityUtils.getCurrentUser();
            return notificationRepository.countByRecipientAndReadFalse(currentUser);
        } catch (Exception e) {
            log.error("❌ ERROR fetching unread count: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsReadForUser(securityUtils.getCurrentUser());
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        User currentUser = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndRecipient(notificationId, currentUser)
                .orElseThrow(() -> new RuntimeException("Notification not found or access denied"));
        
        notificationRepository.delete(notification);
        log.info("Notification #{} deleted by user {}", notificationId, currentUser.getEmail());
    }


    private NotificationResponse convertToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .relatedId(n.getRelatedId())
                .build();
    }
}