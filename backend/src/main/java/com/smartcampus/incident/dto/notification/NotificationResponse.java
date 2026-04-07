package com.smartcampus.incident.dto.notification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private String message;
    private String type;
    private Long ticketId;
    private boolean read;
    private LocalDateTime createdAt;
}
