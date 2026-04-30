package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.ticket.TicketResponse;
import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.entity.Ticket;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.BookingStatus;
import com.smartcampus.incident.repository.BookingRepository;
import com.smartcampus.incident.repository.TicketRepository;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user/dashboard")
@RequiredArgsConstructor
public class UserDashboardController {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        User user = securityUtils.getCurrentUser();
        List<Booking> userBookings = bookingRepository.findById(user);

        long total = userBookings.size();
        long approved = userBookings.stream().filter(b -> b.getStatus() == BookingStatus.APPROVED).count();
        long pending = userBookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count();
        long rejected = userBookings.stream().filter(b -> b.getStatus() == BookingStatus.REJECTED).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalBookings", total);
        summary.put("approvedBookings", approved);
        summary.put("pendingBookings", pending);
        summary.put("rejectedBookings", rejected);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/upcoming-bookings")
    public ResponseEntity<List<BookingResponse>> getUpcomingBookings() {
        User user = securityUtils.getCurrentUser();
        // Simply return all bookings for this user for now, or filter by date >= now
        List<Booking> bookings = bookingRepository.findByUserId(user);
        List<BookingResponse> responses = bookings.stream()
                .filter(b -> b.getStartDateTime().isAfter(LocalDateTime.now()))
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/recent-bookings")
    public ResponseEntity<List<BookingResponse>> getRecentBookings() {
        User user = securityUtils.getCurrentUser();
        List<Booking> bookings = bookingRepository.findByUserId(user);
        // Sort by start date desc and take top 5
        List<BookingResponse> responses = bookings.stream()
                .sorted(Comparator.comparing(Booking::getStartDateTime).reversed())
                .limit(5)
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/active-tickets")
    public ResponseEntity<List<TicketResponse>> getActiveTickets() {
        User user = securityUtils.getCurrentUser();
        // Assuming tickets are for the user who created them
        List<Ticket> tickets = ticketRepository.findByCreatedBy(user, PageRequest.of(0, 100, Sort.by("createdAt").descending())).getContent();
        
        List<TicketResponse> responses = tickets.stream()
                .filter(t -> t.getStatus().name().equals("OPEN") || t.getStatus().name().equals("IN_PROGRESS"))
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/usage-stats")
    public ResponseEntity<Map<String, Object>> getUsageStats() {
        User user = securityUtils.getCurrentUser();
        List<Booking> userBookings = bookingRepository.findById(user);

        LocalDateTime weekStart = LocalDateTime.now().with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0);
        long thisWeek = userBookings.stream()
                .filter(b -> b.getCreatedAt().isAfter(weekStart))
                .count();

        String mostUsed = userBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getResource().getName(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("-");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookingsThisWeek", thisWeek);
        stats.put("mostUsedResource", mostUsed);

        return ResponseEntity.ok(stats);
    }

    private BookingResponse mapToBookingResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .resource(BookingResponse.ResourceSummary.builder()
                        .id(b.getResource().getResourceId())
                        .name(b.getResource().getName())
                        .type(b.getResource().getType().name())
                        .location(b.getResource().getLocation())
                        .build())
                .user(BookingResponse.UserSummary.builder()
                        .id(b.getUser().getUserId())
                        .name(b.getUser().getName())
                        .email(b.getUser().getEmail())
                        .build())
                .startDateTime(b.getStartDateTime())
                .endDateTime(b.getEndDateTime())
                .status(b.getStatus())
                .purpose(b.getPurpose())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private TicketResponse mapToTicketResponse(Ticket t) {
        return TicketResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .category(t.getCategory())
                .priority(t.getPriority())
                .status(t.getStatus())
                .location(t.getLocation())
                .contactDetails(t.getContactDetails())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
