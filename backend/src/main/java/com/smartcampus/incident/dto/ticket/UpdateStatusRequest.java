package com.smartcampus.incident.dto.ticket;

import com.smartcampus.incident.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "New status is required")
    private TicketStatus newStatus;

    /** Required only when newStatus = REJECTED */
    @Size(max = 1000, message = "Rejection reason too long")
    private String rejectionReason;

    /** Required only when newStatus = RESOLVED */
    @Size(max = 2000, message = "Resolution notes too long")
    private String resolutionNotes;
}
