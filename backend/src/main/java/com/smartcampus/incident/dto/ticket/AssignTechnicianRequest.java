package com.smartcampus.incident.dto.ticket;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignTechnicianRequest {

    @NotNull(message = "Technician ID is required")
    private Long technicianId;
}
