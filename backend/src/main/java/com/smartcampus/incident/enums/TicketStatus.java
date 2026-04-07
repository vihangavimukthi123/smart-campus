package com.smartcampus.incident.enums;

/**
 * Ticket lifecycle states.
 * Valid state machine transitions:
 *   OPEN        → IN_PROGRESS  (Admin assigns technician)
 *   IN_PROGRESS → RESOLVED     (Assigned technician only)
 *   RESOLVED    → CLOSED       (Admin or original creator)
 *   OPEN        → REJECTED     (Admin, must provide reason)
 *   IN_PROGRESS → REJECTED     (Admin, must provide reason)
 */
public enum TicketStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED,
    REJECTED
}
