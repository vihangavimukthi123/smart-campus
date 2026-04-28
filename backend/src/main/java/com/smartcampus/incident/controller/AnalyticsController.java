package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.analytics.PeakHourDto;
import com.smartcampus.incident.dto.analytics.ResourceUsageDto;
import com.smartcampus.incident.dto.analytics.TopResourceDto;
import com.smartcampus.incident.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin Analytics Dashboard endpoints.
 *
 * Base path: /api/admin/analytics
 *
 * Sample responses:
 *
 * GET /top-resources
 * [{"resourceId":1,"resourceName":"Lab A","totalBookings":12}, ...]
 *
 * GET /peak-hours
 * [{"hour":9,"bookingCount":8}, {"hour":10,"bookingCount":15}, ...]
 *
 * GET /resource-usage
 * [{"resourceName":"Lab A","totalBookings":12}, ...]
 */
@RestController
@RequestMapping("/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/admin/analytics/top-resources
     * Returns top 5 most booked resources (APPROVED bookings only).
     */
    @GetMapping("/top-resources")
    public ResponseEntity<List<TopResourceDto>> getTopResources() {
        List<TopResourceDto> data = analyticsService.getTopResources();
        if (data.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/analytics/peak-hours
     * Returns approved booking counts grouped by start hour (0–23).
     */
    @GetMapping("/peak-hours")
    public ResponseEntity<List<PeakHourDto>> getPeakHours() {
        List<PeakHourDto> data = analyticsService.getPeakHours();
        if (data.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/analytics/resource-usage
     * Returns booking count for every resource (all statuses).
     */
    @GetMapping("/resource-usage")
    public ResponseEntity<List<ResourceUsageDto>> getResourceUsage() {
        List<ResourceUsageDto> data = analyticsService.getResourceUsage();
        if (data.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/analytics/summary
     * Convenience endpoint returning all three datasets in one request
     * (reduces round-trips for the dashboard).
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(Map.of(
                "topResources",  analyticsService.getTopResources(),
                "peakHours",     analyticsService.getPeakHours(),
                "resourceUsage", analyticsService.getResourceUsage()
        ));
    }
}
