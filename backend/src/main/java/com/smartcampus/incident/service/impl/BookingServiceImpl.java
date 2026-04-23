package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.dto.booking.BookingStatusRequest;
import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.BookingStatus;
import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.exception.UnauthorizedException;
import com.smartcampus.incident.repository.BookingRepository;
import com.smartcampus.incident.repository.ResourceRepository;
import com.smartcampus.incident.repository.specification.BookingSpecification;
import com.smartcampus.incident.service.BookingService;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
                -1L, // No ID yet for new booking
                request.getStartDateTime(), 
                request.getEndDateTime()
        );

        if (hasConflict) {
            throw new IllegalArgumentException("Resource can't be booked for this time because it is already booked.");
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
        return bookingRepository.findByUserId(currentUser.getUserId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(String status, Long resourceId, Long userId, LocalDate date, Pageable pageable) {
        Specification<Booking> spec = BookingSpecification.withFilters(status, resourceId, userId, date);
        return bookingRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));

        User currentUser = securityUtils.getCurrentUser();
        // Permission check: Only the owner or an Admin can view booking details
        if (!booking.getUser().getUserId().equals(currentUser.getUserId()) && !currentUser.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("You are not authorized to view this booking");
        }

        return toResponse(booking);
    }

    @Override
    @Transactional
    public void updateBookingStatus(Long id, BookingStatusRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING bookings can be updated. Current status: " + booking.getStatus());
        }

        BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());
        
        if (newStatus == BookingStatus.APPROVED) {
            // Requirement 6: Re-check for conflict during approval
            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    booking.getResource().getId(),
                    id, // Exclude current booking
                    booking.getStartDateTime(),
                    booking.getEndDateTime()
            );

            if (hasConflict) {
                throw new IllegalArgumentException("Booking conflict detected. Another booking already occupies this slot.");
            }
            log.info("Booking #{} approved by admin", id);
        } else if (newStatus == BookingStatus.REJECTED) {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Rejection reason is required.");
            }
            booking.setRejectionReason(request.getReason());
            log.info("Booking #{} rejected by admin. Reason: {}", id, request.getReason());
        } else {
            throw new IllegalArgumentException("Invalid status transition for admin update.");
        }

        booking.setStatus(newStatus);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void cancelBooking(Long id, CancelBookingRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));

        User currentUser = securityUtils.getCurrentUser();
        // Permission check: Only the owner can cancel
        if (!booking.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new UnauthorizedException("You are not authorized to cancel this booking");
        }

        // Requirements check: Only APPROVED bookings can be cancelled
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (request != null && request.getReason() != null) {
            booking.setCancellationReason(request.getReason());
        }
        
        bookingRepository.save(booking);
        log.info("Booking #{} cancelled by user {}. Reason: {}", id, currentUser.getEmail(), booking.getCancellationReason());
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .resource(BookingResponse.ResourceSummary.builder()
                        .id(booking.getResource().getId())
                        .name(booking.getResource().getName())
                        .type(booking.getResource().getType().name())
                        .location(booking.getResource().getLocation())
                        .build())
                .user(BookingResponse.UserSummary.builder()
                        .id(booking.getUser().getUserId())
                        .name(booking.getUser().getName())
                        .email(booking.getUser().getEmail())
                        .build())
                .startDateTime(booking.getStartDateTime())
                .endDateTime(booking.getEndDateTime())
                .purpose(booking.getPurpose())
                .attendees(booking.getAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .cancelledAt(booking.getCancelledAt())
                .cancellationReason(booking.getCancellationReason())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
