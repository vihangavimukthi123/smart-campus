package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.notification.NotificationResponse;
import com.smartcampus.incident.entity.Notification;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.exception.UnauthorizedException;
import com.smartcampus.incident.repository.NotificationRepository;
import com.smartcampus.incident.service.NotificationService;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Async
    @Transactional
    public void notifyStatusChange(Long ticketId, User recipient, String newStatus) {
        persist(recipient,
            String.format("Your ticket #%d status has been updated to: %s", ticketId, newStatus),
            "STATUS_CHANGE", ticketId);
    }

    @Override
    @Async
    @Transactional
    public void notifyNewComment(Long ticketId, User recipient, String commenterName) {
        persist(recipient,
            String.format("%s added a comment on ticket #%d", commenterName, ticketId),
            "NEW_COMMENT", ticketId);
    }

    @Override
    @Async
    @Transactional
    public void notifyAssignment(Long ticketId, User technician, String ticketTitle) {
        persist(technician,
            String.format("You have been assigned to ticket #%d: \"%s\"", ticketId, ticketTitle),
            "ASSIGNMENT", ticketId);
    }

    @Override
    @Async
    @Transactional
    public void notifyNewTicket(Long ticketId, User admin, String ticketTitle) {
        persist(admin,
            String.format("New ticket submitted: \"%s\" (#%d)", ticketTitle, ticketId),
            "STATUS_CHANGE", ticketId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        User current = securityUtils.getCurrentUser();
        return notificationRepository
            .findByRecipientOrderByCreatedAtDesc(current, pageable)
            .map(this::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User current = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getUserId().equals(current.getUserId())) {
            throw new UnauthorizedException("You cannot modify other users' notifications");
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User current = securityUtils.getCurrentUser();
        return notificationRepository.countByRecipientAndReadFalse(current);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        User current = securityUtils.getCurrentUser();
        notificationRepository.markAllAsReadForUser(current);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void persist(User recipient, String message, String type, Long ticketId) {
        Notification notification = Notification.builder()
            .recipient(recipient)
            .message(message)
            .type(type)
            .ticketId(ticketId)
            .build();
        notificationRepository.save(notification);
        log.debug("Notification [{}] sent to user {}: {}", type, recipient.getEmail(), message);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .message(n.getMessage())
            .type(n.getType())
            .ticketId(n.getTicketId())
            .read(n.isRead())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
