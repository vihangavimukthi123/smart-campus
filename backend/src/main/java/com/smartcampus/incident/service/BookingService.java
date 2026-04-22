package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(CreateBookingRequest request);
    List<BookingResponse> getMyBookings();
    BookingResponse getBookingById(Long id);
    void cancelBooking(Long id);
}
