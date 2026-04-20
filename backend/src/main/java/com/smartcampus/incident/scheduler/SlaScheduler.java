package com.smartcampus.incident.scheduler;

import com.smartcampus.incident.service.SlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for SLA breaches in open tickets.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SlaScheduler {

    private final SlaService slaService;

    /**
     * Runs every 2 minutes to check for SLA breaches.
     */
    @Scheduled(fixedRate = 120000)
    public void checkSlaBreaches() {
        log.debug("Running scheduled SLA breach check...");
        slaService.checkSlaBreaches();
    }
}
