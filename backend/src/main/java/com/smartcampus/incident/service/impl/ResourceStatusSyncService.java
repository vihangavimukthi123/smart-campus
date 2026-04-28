package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.enums.BookingStatus;
import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.repository.BookingRepository;
import com.smartcampus.incident.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceStatusSyncService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    @Transactional
    public void refreshAllResourceStatuses() {
        LocalDateTime now = LocalDateTime.now();
        Set<Long> occupiedResourceIds = new HashSet<>(
                bookingRepository.findActiveResourceIds(BookingStatus.APPROVED, now));

        List<Resource> managedResources = resourceRepository.findAll().stream()
                .filter(resource -> !resource.isDeleted())
                .filter(resource -> resource.getStatus() != ResourceStatus.MAINTENANCE)
                .filter(resource -> resource.getStatus() != ResourceStatus.RETIRED)
                .filter(resource -> resource.getStatus() != ResourceStatus.OUT_OF_SERVICE)
                .toList();

        boolean changed = false;
        for (Resource resource : managedResources) {
            ResourceStatus desiredStatus = occupiedResourceIds.contains(resource.getId())
                    ? ResourceStatus.OCCUPIED
                    : ResourceStatus.AVAILABLE;

            if (resource.getStatus() != desiredStatus) {
                resource.setStatus(desiredStatus);
                changed = true;
            }
        }

        if (changed) {
            resourceRepository.saveAll(managedResources);
            log.debug("Refreshed resource availability for {} resources", managedResources.size());
        }
    }

    @Transactional
    public void refreshResourceStatus(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId).orElse(null);

        if (resource == null || resource.isDeleted()) {
            return;
        }

        if (resource.getStatus() == ResourceStatus.MAINTENANCE
                || resource.getStatus() == ResourceStatus.RETIRED
                || resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean occupied = bookingRepository.hasActiveBookingForResource(resourceId, BookingStatus.APPROVED, now);
        ResourceStatus desiredStatus = occupied ? ResourceStatus.OCCUPIED : ResourceStatus.AVAILABLE;

        if (resource.getStatus() != desiredStatus) {
            resource.setStatus(desiredStatus);
            resourceRepository.save(resource);
            log.debug("Resource #{} status synced to {}", resourceId, desiredStatus);
        }
    }
}