package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.notification.NotificationResponse;
import com.smartcampus.incident.entity.Notification;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.NotificationRepository;
import com.smartcampus.incident.service.NotificationService;
import com.smartcampus.incident.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

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
    @Transactional
    public void notifyNewTicket(Long ticketId, User admin, String ticketTitle) {
        String message = "New incident reported: " + ticketTitle;
        saveAndSend(admin, message, "NEW_TICKET", ticketId);
    }

    
    private void saveAndSend(User recipient, String message, String type, Long ticketId) {
        // save to DB
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .relatedId(ticketId) // relatedId ලෙස අපේ entity එකේ තිබිය යුතුයි
                .read(false)
                .build();
        notificationRepository.save(notification);

        // send email notifications if user has enabled email notifications
        if (recipient.isEmailNotify()) {
            emailService.sendSimpleEmail(recipient.getEmail(), "SmartCampus Update", message);
        }
    }

    @Override
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser, pageable)
                .map(this::convertToResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndRecipient(notificationId, currentUser)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setRead(true);
        return convertToResponse(notificationRepository.save(notification));
    }

    @Override
    public long getUnreadCount() {
        return notificationRepository.countByRecipientAndReadFalse(getCurrentUser());
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsReadForUser(getCurrentUser());
    }

    // Helper method to get current logged in user
    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
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