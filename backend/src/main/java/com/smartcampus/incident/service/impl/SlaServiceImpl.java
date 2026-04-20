package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.ticket.SlaStatsResponse;
import com.smartcampus.incident.entity.Ticket;
import com.smartcampus.incident.enums.SlaStatus;
import com.smartcampus.incident.enums.TicketStatus;
import com.smartcampus.incident.repository.TicketRepository;
import com.smartcampus.incident.service.SlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaServiceImpl implements SlaService {

    private final TicketRepository ticketRepository;

    @Value("${app.sla.ttfr-threshold-hours:2}")
    private int ttfrThresholdHours;

    @Value("${app.sla.ttr-threshold-hours:24}")
    private int ttrThresholdHours;

    @Override
    public SlaStatsResponse getSlaStats() {
        long total = ticketRepository.count();
        long breached = ticketRepository.countBySlaStatus(SlaStatus.BREACHED);
        
        Double avgTtfr = ticketRepository.findAverageTtfrSeconds();
        Double avgTtr = ticketRepository.findAverageTtrSeconds();

        return SlaStatsResponse.builder()
            .totalTickets(total)
            .breachedTickets(breached)
            .breachRate(total > 0 ? (double) breached / total * 100 : 0)
            .averageTtfrSeconds(avgTtfr != null ? avgTtfr : 0)
            .averageTtrSeconds(avgTtr != null ? avgTtr : 0)
            .build();
    }

    @Override
    @Transactional
    public void markFirstResponse(Ticket ticket) {
        if (ticket.getFirstResponseAt() != null) {
            return; // Already responded
        }

        Instant now = Instant.now();
        ticket.setFirstResponseAt(now);

        Instant created = ticket.getCreatedAt().toInstant(ZoneOffset.UTC);
        long durationSeconds = Duration.between(created, now).getSeconds();
        ticket.setTtfrDuration(durationSeconds);

        if (durationSeconds > Duration.ofHours(ttfrThresholdHours).getSeconds()) {
            ticket.setSlaStatus(SlaStatus.BREACHED);
            log.warn("Ticket #{} BREACHED TTFR SLA (Duration: {}s)", ticket.getId(), durationSeconds);
        }

        ticketRepository.save(ticket);
    }

    @Override
    @Transactional
    public void markResolution(Ticket ticket) {
        if (ticket.getResolvedAt() != null) {
            return;
        }

        Instant now = Instant.now();
        ticket.setResolvedAt(now);

        Instant created = ticket.getCreatedAt().toInstant(ZoneOffset.UTC);
        long durationSeconds = Duration.between(created, now).getSeconds();
        ticket.setTtrDuration(durationSeconds);

        // If it was already breached (e.g. by TTFR), we keep it breached.
        // If not, check TTR threshold.
        if (durationSeconds > Duration.ofHours(ttrThresholdHours).getSeconds()) {
            ticket.setSlaStatus(SlaStatus.BREACHED);
            log.warn("Ticket #{} BREACHED TTR SLA (Duration: {}s)", ticket.getId(), durationSeconds);
        }

        ticketRepository.save(ticket);
    }

    @Override
    @Transactional
    public void checkSlaBreaches() {
        // Open/In Progress tickets needing check
        List<TicketStatus> activeStates = List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS);
        List<Ticket> activeTickets = ticketRepository.findAllByStatusInAndSlaStatus(activeStates, SlaStatus.WITHIN_SLA);

        Instant now = Instant.now();
        int breachedCount = 0;

        for (Ticket ticket : activeTickets) {
            Instant created = ticket.getCreatedAt().toInstant(ZoneOffset.UTC);
            long secondsSinceCreation = Duration.between(created, now).getSeconds();

            boolean ttfrBreached = (ticket.getFirstResponseAt() == null && 
                                    secondsSinceCreation > Duration.ofHours(ttfrThresholdHours).getSeconds());
            
            boolean ttrBreached = secondsSinceCreation > Duration.ofHours(ttrThresholdHours).getSeconds();

            if (ttfrBreached || ttrBreached) {
                ticket.setSlaStatus(SlaStatus.BREACHED);
                ticketRepository.save(ticket);
                breachedCount++;
                log.info("Ticket #{} marked as BREACHED via scheduler", ticket.getId());
            }
        }

        if (breachedCount > 0) {
            log.info("SLA Breach check completed: {} tickets marked as BREACHED", breachedCount);
        }
    }

    @Override
    public long getSecondsUntilBreach(Ticket ticket) {
        if (ticket.getSlaStatus() == SlaStatus.BREACHED) {
            return 0;
        }

        Instant created = ticket.getCreatedAt().toInstant(ZoneOffset.UTC);
        Instant now = Instant.now();
        long secondsSinceCreation = Duration.between(created, now).getSeconds();

        if (ticket.getFirstResponseAt() == null) {
            // Check TTFR breach time
            long ttfrRemaining = Duration.ofHours(ttfrThresholdHours).getSeconds() - secondsSinceCreation;
            return Math.max(0, ttfrRemaining);
        } else {
            // Check TTR breach time
            long ttrRemaining = Duration.ofHours(ttrThresholdHours).getSeconds() - secondsSinceCreation;
            return Math.max(0, ttrRemaining);
        }
    }
}
