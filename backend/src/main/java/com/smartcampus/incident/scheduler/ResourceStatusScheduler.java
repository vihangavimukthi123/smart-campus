package com.smartcampus.incident.scheduler;

import com.smartcampus.incident.service.impl.ResourceStatusSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ResourceStatusScheduler {

    private final ResourceStatusSyncService resourceStatusSyncService;

    @Scheduled(fixedRate = 10000)
    public void refreshResourceStatuses() {
        log.debug("Running scheduled resource status sync...");
        resourceStatusSyncService.refreshAllResourceStatuses();
    }
}