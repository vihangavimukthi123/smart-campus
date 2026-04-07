package com.smartcampus.incident.enums;

/**
 * System roles controlling access levels throughout the application.
 */
public enum Role {
    /** Regular student/staff who submits tickets */
    USER,
    /** Campus administrator with full oversight */
    ADMIN,
    /** Maintenance/technical staff assigned to tickets */
    TECHNICIAN
}
