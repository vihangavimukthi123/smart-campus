package com.smartcampus.incident.dto.booking;

import com.smartcampus.incident.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private ResourceSummary resource;
    private UserSummary user;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String purpose;
    private Integer attendees;
    private BookingStatus status;
    private String rejectionReason;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private String verificationToken;
    private String qrCodeImage;

    @Data
    @Builder
    public static class ResourceSummary {
        private Long id;
        private String name;
        private String type;
        private String location;
    }

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
