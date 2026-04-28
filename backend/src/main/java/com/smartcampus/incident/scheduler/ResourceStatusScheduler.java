package com.smartcampus.incident.scheduler;

import com.smartcampus.incident.service.impl.ResourceStatusSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ResourceStatusScheduler {

    private final ResourceStatusSyncService resourceStatusSyncService;

    @Scheduled(initialDelayString = "60000", fixedDelayString = "30000")
    public void refreshResourceStatuses() {
        try {
            log.debug("Running scheduled resource status sync...");
            resourceStatusSyncService.refreshAllResourceStatuses();
        } catch (DataAccessException ex) {
            log.warn("Skipping resource status sync due to transient database lock: {}", ex.getMessage());
        }
    }
}