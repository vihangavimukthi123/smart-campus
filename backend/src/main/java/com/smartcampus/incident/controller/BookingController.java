package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.dto.booking.BookingStatusRequest;
import com.smartcampus.incident.dto.booking.UpdateBookingRequest;
import com.smartcampus.incident.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Resource booking management endpoints")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create a new resource booking request")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's booking requests")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all booking requests (Admin only)")
    public ResponseEntity<Page<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, userId, date, pageable));
    }

    @GetMapping("/resource/{resourceId}")
    @Operation(summary = "Get bookings for a specific resource (by day)")
    public ResponseEntity<List<BookingResponse>> getBookingsForResource(
            @PathVariable Long resourceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = date == null ? LocalDate.now() : date;
        return ResponseEntity.ok(bookingService.getBookingsForResource(resourceId, queryDate));
    }

    @GetMapping("/check-conflicts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get conflicting bookings (Pending/Rejected) for a booking slot")
    public ResponseEntity<List<BookingResponse>> getConflictingBookings(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getConflictingBookings(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a booking (Owner or Admin)")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id,
            @Valid @RequestBody UpdateBookingRequest request) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an approved booking")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id,
            @RequestBody(required = false) CancelBookingRequest request) {
        bookingService.cancelBooking(id, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve or Reject a booking (Admin only)")
    public ResponseEntity<Void> updateBookingStatus(@PathVariable Long id,
            @Valid @RequestBody BookingStatusRequest request) {
        bookingService.updateBookingStatus(id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public/{token}")
    @Operation(summary = "Get booking details via token (Public)")
    public ResponseEntity<BookingResponse> getBookingByToken(@PathVariable String token) {
        return ResponseEntity.ok(bookingService.getBookingByToken(token));
    }
}
