package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.notification.NotificationResponse;
import com.smartcampus.incident.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void notifyStatusChange(Long ticketId, User recipient, String newStatus);
    void notifyNewComment(Long ticketId, User recipient, String commenterName);
    void notifyAssignment(Long ticketId, User technician, String ticketTitle);
    void notifyNewTicket(Long ticketId, User admin, String ticketTitle);

    // Booking Notifications
    void notifyNewBooking(Long bookingId, User admin, String resourceName, String userName);
    void notifyBookingStatusUpdate(Long bookingId, User recipient, String status, String resourceName, String reason);

    Page<NotificationResponse> getMyNotifications(Pageable pageable);
    NotificationResponse markAsRead(Long notificationId);
    long getUnreadCount();
    void markAllAsRead();
    void deleteNotification(Long notificationId);
}
