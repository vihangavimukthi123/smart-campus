package com.smartcampus.incident.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Represents the SLA state of a ticket.
 */
@Getter
@RequiredArgsConstructor
public enum SlaStatus {
    WITHIN_SLA("Within SLA"),
    BREACHED("Breached");

    private final String displayName;
}
