package com.smartcampus.incident.enums;

public enum ResourceStatus {
    AVAILABLE,
    OCCUPIED,
    MAINTENANCE,
    RETIRED,
    // Legacy statuses kept for backward compatibility with existing rows.
    ACTIVE,
    OUT_OF_SERVICE
}
