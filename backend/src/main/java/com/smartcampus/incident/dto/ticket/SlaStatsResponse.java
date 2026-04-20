package com.smartcampus.incident.dto.ticket;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SlaStatsResponse {
    private long totalTickets;
    private long breachedTickets;
    private double breachRate; // percentage
    private double averageTtfrSeconds;
    private double averageTtrSeconds;
}
