package com.smartcampus.incident.dto.ticket;

import com.smartcampus.incident.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, message = "Please provide a detailed description (min 20 characters)")
    private String description;

    @NotBlank(message = "Category is required")
    @Size(max = 100)
    private String category;

    @NotBlank(message = "Location is required")
    @Size(max = 200)
    private String location;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @Size(max = 200)
    private String contactDetails;
}
