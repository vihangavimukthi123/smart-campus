package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.analytics.PeakHourDto;
import com.smartcampus.incident.dto.analytics.ResourceUsageDto;
import com.smartcampus.incident.dto.analytics.TopResourceDto;

import java.util.List;

public interface AnalyticsService {

    /** Top 5 most booked resources (APPROVED bookings only). */
    List<TopResourceDto> getTopResources();

    /** Approved bookings grouped by start hour (0–23). */
    List<PeakHourDto> getPeakHours();

    /** All resources with their total booking count. */
    List<ResourceUsageDto> getResourceUsage();

    /** Total count of rejected bookings. */
    long getRejectedBookingsCount();
}
