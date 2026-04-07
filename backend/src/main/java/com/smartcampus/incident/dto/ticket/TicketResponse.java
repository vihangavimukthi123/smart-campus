package com.smartcampus.incident.dto.ticket;

import com.smartcampus.incident.enums.TicketPriority;
import com.smartcampus.incident.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String location;
    private String contactDetails;
    private TicketStatus status;
    private TicketPriority priority;
    private String rejectionReason;
    private String resolutionNotes;

    // Nested minimal user info
    private UserSummary createdBy;
    private UserSummary assignedTo;

    private long commentCount;
    private List<AttachmentSummary> attachments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private String role;
    }

    @Data
    @Builder
    public static class AttachmentSummary {
        private Long id;
        private String originalFileName;
        private String contentType;
        private Long fileSize;
        private String downloadUrl;
    }
}
