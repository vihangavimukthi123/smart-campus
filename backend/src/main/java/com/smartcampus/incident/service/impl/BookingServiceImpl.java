package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.BookingStatus;
import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.exception.UnauthorizedException;
import com.smartcampus.incident.repository.BookingRepository;
import com.smartcampus.incident.repository.ResourceRepository;
import com.smartcampus.incident.service.BookingService;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", request.getResourceId()));

        // Validation 1: Resource must be ACTIVE or AVAILABLE
        if (resource.getStatus() != ResourceStatus.ACTIVE && resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new IllegalArgumentException("Resource is not available for booking. Current status: " + resource.getStatus());
        }

        // Validation 2: End time must be later than start time
        if (request.getEndDateTime().isBefore(request.getStartDateTime()) || 
            request.getEndDateTime().isEqual(request.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be later than start time");
        }

        // Validation 3: Start time must not be in the past
        if (request.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Booking cannot be made in the past");
        }

        // Validation 4: Conflict checking
        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                request.getResourceId(), 
                request.getStartDateTime(), 
                request.getEndDateTime()
        );

        if (hasConflict) {
            throw new IllegalArgumentException("Booking conflict: The selected resource is already booked for this time period.");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(currentUser)
                .startDateTime(request.getStartDateTime())
                .endDateTime(request.getEndDateTime())
                .purpose(request.getPurpose())
                .attendees(request.getAttendees())
                .status(BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);
        log.info("Booking request #{} created by user {} for resource {}", 
                booking.getId(), currentUser.getEmail(), resource.getName());

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings() {
        User currentUser = securityUtils.getCurrentUser();
        return bookingRepository.findByUserId(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));
        
        User currentUser = securityUtils.getCurrentUser();
        if (!booking.getUser().getId().equals(currentUser.getId()) && 
            currentUser.getRole().name().equals("USER")) {
            throw new UnauthorizedException("You do not have permission to view this booking");
        }
        
        return toResponse(booking);
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .resource(BookingResponse.ResourceSummary.builder()
                        .id(booking.getResource().getId())
                        .name(booking.getResource().getName())
                        .location(booking.getResource().getLocation())
                        .build())
                .user(BookingResponse.UserSummary.builder()
                        .id(booking.getUser().getId())
                        .name(booking.getUser().getName())
                        .email(booking.getUser().getEmail())
                        .build())
                .startDateTime(booking.getStartDateTime())
                .endDateTime(booking.getEndDateTime())
                .purpose(booking.getPurpose())
                .attendees(booking.getAttendees())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
