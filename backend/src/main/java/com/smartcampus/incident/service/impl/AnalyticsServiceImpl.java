package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.analytics.PeakHourDto;
import com.smartcampus.incident.dto.analytics.ResourceUsageDto;
import com.smartcampus.incident.dto.analytics.TopResourceDto;
import com.smartcampus.incident.enums.BookingStatus;
import com.smartcampus.incident.repository.BookingRepository;
import com.smartcampus.incident.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final int TOP_RESOURCES_LIMIT = 5;

    private final BookingRepository bookingRepository;

    @Override
    public List<TopResourceDto> getTopResources() {
        List<TopResourceDto> result = bookingRepository.findTopResources(
                BookingStatus.APPROVED,
                PageRequest.of(0, TOP_RESOURCES_LIMIT));
        return result.isEmpty() ? Collections.emptyList() : result;
    }

    @Override
    public List<PeakHourDto> getPeakHours() {
        List<PeakHourDto> result = bookingRepository.findPeakHours(BookingStatus.APPROVED);
        return result.isEmpty() ? Collections.emptyList() : result;
    }

    @Override
    public List<ResourceUsageDto> getResourceUsage() {
        List<ResourceUsageDto> result = bookingRepository.findResourceUsage();
        return result.isEmpty() ? Collections.emptyList() : result;
    }

    @Override
    public long getRejectedBookingsCount() {
        return bookingRepository.countByStatus(BookingStatus.REJECTED);
    }
}