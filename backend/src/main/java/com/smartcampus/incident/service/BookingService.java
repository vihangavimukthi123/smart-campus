package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.dto.booking.BookingStatusRequest;
import com.smartcampus.incident.dto.booking.BookingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    BookingResponse createBooking(CreateBookingRequest request);

    List<BookingResponse> getMyBookings();

    Page<BookingResponse> getAllBookings(String status, Long resourceId, Long userId, LocalDate date,
            Pageable pageable);

    List<BookingResponse> getBookingsForResource(Long resourceId, LocalDate date);

    BookingResponse getBookingById(Long id);

    void updateBookingStatus(Long id, BookingStatusRequest request);

    void cancelBooking(Long id, CancelBookingRequest request);
    BookingResponse getBookingByToken(String token);
    List<BookingResponse> getConflictingBookings(Long id);
}
