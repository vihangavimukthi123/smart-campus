package com.smartcampus.incident.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusRequest {
    @NotNull(message = "Status is required")
    private String status; // APPROVED, REJECTED
    
    private String reason;
}
