package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.ticket.SlaStatsResponse;
import com.smartcampus.incident.entity.Ticket;

/**
 * Service for calculating SLA metrics and managing breach detection.
 */
public interface SlaService {

    /**
     * Gets aggregated SLA performance statistics.
     */
    SlaStatsResponse getSlaStats();

    /**
     * Marks the first response on a ticket and calculates TTFR.
     * @param ticket The ticket to update
     */
    void markFirstResponse(Ticket ticket);

    /**
     * Marks a ticket as resolved and calculates TTR.
     * @param ticket The ticket to update
     */
    void markResolution(Ticket ticket);

    /**
     * Periodically called to check for SLA breaches on open/in-progress tickets.
     */
    void checkSlaBreaches();

    /**
     * Calculates the "Time to Breach" for a ticket in its current state.
     * Useful for frontend timers.
     */
    long getSecondsUntilBreach(Ticket ticket);
}
