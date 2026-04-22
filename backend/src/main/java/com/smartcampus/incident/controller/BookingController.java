package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an approved booking")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id, @RequestBody(required = false) CancelBookingRequest request) {
        bookingService.cancelBooking(id, request);
        return ResponseEntity.noContent().build();
    }
}
