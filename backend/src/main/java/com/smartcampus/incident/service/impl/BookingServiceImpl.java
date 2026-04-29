package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.booking.BookingResponse;
import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.dto.booking.BookingStatusRequest;
import com.smartcampus.incident.dto.booking.UpdateBookingRequest;
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
import com.smartcampus.incident.service.QrCodeService;
import com.smartcampus.incident.service.impl.ResourceStatusSyncService;
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
    private final ResourceStatusSyncService resourceStatusSyncService;
    private final SecurityUtils securityUtils;
    private final QrCodeService qrCodeService;

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", request.getResourceId()));

        // Validation 1: Resource must be ACTIVE or AVAILABLE
        if (resource.getStatus() != ResourceStatus.ACTIVE && resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new IllegalArgumentException(
                    "Resource is not available for booking. Current status: " + resource.getStatus());
        }

        // Validation 2: End time must be later than start time
        if (request.getEndDateTime().isBefore(request.getStartDateTime()) ||
                request.getEndDateTime().isEqual(request.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be later than start time");
        }

        // Validation 3: Attendees cannot exceed resource capacity
        if (request.getAttendees() != null && request.getAttendees() > resource.getCapacity()) {
            throw new IllegalArgumentException(
                    String.format("Expected attendees (%d) exceeds resource capacity (%d)", 
                    request.getAttendees(), resource.getCapacity()));
        }

        // Validation 3: Start time must not be in the past
        if (request.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Booking cannot be made in the past");
        }

        // Validation 4: Conflict checking (excludeId = 0L means no existing booking to
        // exclude)
        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                request.getResourceId(),
                request.getStartDateTime(),
                request.getEndDateTime(),
                0L);

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
    @Transactional
    public List<BookingResponse> getMyBookings() {
        User currentUser = securityUtils.getCurrentUser();
        List<Booking> bookings = bookingRepository.findByUserId(currentUser.getUserId());
        
        // Ensure approved bookings have verification tokens
        boolean updated = false;
        for (Booking booking : bookings) {
            if (booking.getStatus() == BookingStatus.APPROVED && booking.getVerificationToken() == null) {
                booking.setVerificationToken(qrCodeService.generateVerificationToken(booking.getId()));
                updated = true;
            }
        }
        if (updated) {
            bookingRepository.saveAll(bookings);
        }

        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsForResource(Long resourceId, LocalDate date) {
        // default to today when not provided
        LocalDate queryDate = date == null ? LocalDate.now() : date;
        var spec = BookingSpecification.withFilters(null, resourceId, null, queryDate);
        return bookingRepository.findAll(spec).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(String status, Long resourceId, Long userId, LocalDate date,
            Pageable pageable) {
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
        if (!booking.getUser().getUserId().equals(currentUser.getUserId())
                && !currentUser.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("You are not authorized to view this booking");
        }

        return toResponse(booking);
    }

    @Override
    @Transactional
    public void updateBookingStatus(Long id, BookingStatusRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));

        BookingStatus currentStatus = booking.getStatus();
        BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());

        // Only allow transitions:
        // PENDING -> APPROVED or REJECTED
        // APPROVED -> REJECTED
        // REJECTED -> APPROVED
        if (currentStatus == BookingStatus.PENDING) {
            if (newStatus != BookingStatus.APPROVED && newStatus != BookingStatus.REJECTED) {
                throw new IllegalArgumentException("Invalid status transition from PENDING: " + newStatus);
            }
        } else if (currentStatus == BookingStatus.APPROVED) {
            if (newStatus != BookingStatus.REJECTED) {
                throw new IllegalArgumentException("Only REJECTED status is allowed for already APPROVED bookings.");
            }
        } else if (currentStatus == BookingStatus.REJECTED) {
            if (newStatus != BookingStatus.APPROVED) {
                throw new IllegalArgumentException("Only APPROVED status is allowed for already REJECTED bookings.");
            }
            // Clear rejection reason if moving to APPROVED
            booking.setRejectionReason(null);
            log.info("Booking #{} changed from REJECTED to APPROVED by admin", id);
        } else {
            throw new IllegalArgumentException("Cannot update status for bookings that are " + currentStatus);
        }

        if (newStatus == BookingStatus.APPROVED) {
            // Conflict Resolution Logic (Swap)
            if (request.getConflictingBookingId() != null) {
                Booking conflictingBooking = bookingRepository.findById(request.getConflictingBookingId())
                        .orElseThrow(() -> new ResourceNotFoundException("Conflicting Booking", request.getConflictingBookingId()));
                
                // If we are approving a REJECTED booking and want to reject/cancel a PENDING or APPROVED one
                if (conflictingBooking.getStatus() == BookingStatus.PENDING || conflictingBooking.getStatus() == BookingStatus.APPROVED) {
                    BookingStatus oldStatus = conflictingBooking.getStatus();
                    conflictingBooking.setStatus(BookingStatus.REJECTED);
                    conflictingBooking.setRejectionReason(request.getReason() != null ? request.getReason() : "Conflict resolution: Another booking was approved for this slot.");
                    bookingRepository.save(conflictingBooking);
                    log.info("Conflicting booking #{} ({}) automatically REJECTED due to approval of #{}", conflictingBooking.getId(), oldStatus, id);
                }
            }

            // Re-check for conflict during approval, excluding this booking itself
            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    booking.getResource().getId(),
                    booking.getStartDateTime(),
                    booking.getEndDateTime(),
                    booking.getId() // exclude self so PENDING→APPROVED doesn't flag itself
            );

            if (hasConflict) {
                throw new IllegalArgumentException(
                        "Booking conflict detected. Another APPROVED booking already occupies this slot.");
            }

            // Generate verification token if not already present
            if (booking.getVerificationToken() == null) {
                booking.setVerificationToken(qrCodeService.generateVerificationToken(id));
            }
            log.info("Booking #{} approved by admin", id);
        } else if (newStatus == BookingStatus.REJECTED) {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Rejection reason is required.");
            }
            booking.setRejectionReason(request.getReason());
            log.info("Booking #{} rejected by admin. Reason: {}", id, request.getReason());
        }

        booking.setStatus(newStatus);
        bookingRepository.save(booking);
        resourceStatusSyncService.refreshResourceStatus(booking.getResource().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getConflictingBookings(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));
        
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResource().getId(),
                booking.getStartDateTime(),
                booking.getEndDateTime(),
                id
        );

        return conflicts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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
            throw new IllegalArgumentException(
                    "Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
        }

        // Prevent cancelling past bookings
        if (booking.getEndDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot cancel a booking that has already finished");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (request != null && request.getReason() != null) {
            booking.setCancellationReason(request.getReason());
        }

        bookingRepository.save(booking);
        resourceStatusSyncService.refreshResourceStatus(booking.getResource().getId());
        log.info("Booking #{} cancelled by user {}. Reason: {}", id, currentUser.getEmail(),
                booking.getCancellationReason());
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, UpdateBookingRequest request) {
        log.info("Attempting to update booking #{} with data: {}", id, request);
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Booking #{} not found", id);
                    return new ResourceNotFoundException("Booking", id);
                });

        User currentUser = securityUtils.getCurrentUser();
        log.info("Current user: {}", currentUser.getEmail());
        
        // 1. Permission check: Only owner or Admin
        if (!booking.getUser().getUserId().equals(currentUser.getUserId()) && !currentUser.getRole().name().equals("ADMIN")) {
            log.error("User {} not authorized to edit booking #{} (owner: {})", 
                currentUser.getEmail(), id, booking.getUser().getEmail());
            throw new UnauthorizedException("You are not authorized to edit this booking");
        }

        // 2. Status check: Only PENDING or APPROVED
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            log.error("Cannot edit booking #{} with status {}", id, booking.getStatus());
            throw new IllegalArgumentException("Only PENDING or APPROVED bookings can be edited");
        }

        // 3. Time check: Only upcoming (not past)
        if (booking.getStartDateTime().isBefore(LocalDateTime.now())) {
            log.error("Cannot edit past booking #{} (start: {})", id, booking.getStartDateTime());
            throw new IllegalArgumentException("Cannot edit a booking that has already started or passed");
        }

        // 4. End time validation
        if (request.getEndDateTime().isBefore(request.getStartDateTime()) ||
                request.getEndDateTime().isEqual(request.getStartDateTime())) {
            log.error("Invalid time range: {} to {}", request.getStartDateTime(), request.getEndDateTime());
            throw new IllegalArgumentException("End time must be later than start time");
        }

        // 4.5. Capacity check
        if (request.getAttendees() != null && request.getAttendees() > booking.getResource().getCapacity()) {
            log.error("Attendees (%d) exceeds capacity (%d) for resource #%d", 
                request.getAttendees(), booking.getResource().getCapacity(), booking.getResource().getId());
            throw new IllegalArgumentException(
                    String.format("Expected attendees (%d) exceeds resource capacity (%d)", 
                    request.getAttendees(), booking.getResource().getCapacity()));
        }

        // 5. Conflict checking (if time changed)
        boolean timeChanged = !booking.getStartDateTime().isEqual(request.getStartDateTime()) || 
                              !booking.getEndDateTime().isEqual(request.getEndDateTime());
        
        if (timeChanged) {
            log.info("Time changed for booking #{}. Checking for conflicts...", id);
            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    booking.getResource().getId(),
                    request.getStartDateTime(),
                    request.getEndDateTime(),
                    booking.getId());

            if (hasConflict) {
                log.error("Conflict detected for booking #{} new time slot", id);
                throw new IllegalArgumentException("Resource is already booked for the new time slot");
            }
        }

        // Update fields
        booking.setStartDateTime(request.getStartDateTime());
        booking.setEndDateTime(request.getEndDateTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendees(request.getAttendees());

        // Re-approval logic: If not admin and time changed, move back to PENDING
        if (!currentUser.getRole().name().equals("ADMIN") && timeChanged && booking.getStatus() == BookingStatus.APPROVED) {
            log.info("Moving booking #{} back to PENDING for re-approval", id);
            booking.setStatus(BookingStatus.PENDING);
            booking.setVerificationToken(null); 
        }

        booking = bookingRepository.save(booking);
        resourceStatusSyncService.refreshResourceStatus(booking.getResource().getId());
        log.info("Booking #{} successfully updated by user {}", id, currentUser.getEmail());

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByToken(String token) {
        Booking booking = bookingRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Booking with token: " + token, 0L));
        return toResponse(booking);
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
                .verificationToken(booking.getVerificationToken())
                .qrCodeImage(booking.getStatus() == BookingStatus.APPROVED && booking.getVerificationToken() != null 
                        ? qrCodeService.generateQrCodeImage(booking.getVerificationToken()) 
                        : null)
                .build();
    }
}
