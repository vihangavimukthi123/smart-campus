package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.ticket.*;
import com.smartcampus.incident.entity.*;
import com.smartcampus.incident.enums.*;
import com.smartcampus.incident.exception.*;
import com.smartcampus.incident.repository.*;
import com.smartcampus.incident.service.*;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * Core business logic for the Incident Ticket module.
 * Enforces state machine transitions, role-based actions,
 * and triggers notifications on every meaningful event.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentRepository commentRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Value("${app.file-storage.max-files-per-ticket}")
    private int maxFilesPerTicket;

    // ── VALID state machine transitions ───────────────────────────────────────
    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = Map.of(
        TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED),
        TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.REJECTED),
        TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED),
        TicketStatus.CLOSED, Collections.emptySet(),
        TicketStatus.REJECTED, Collections.emptySet()
    );

    // ── CREATE ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Ticket ticket = Ticket.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .category(request.getCategory())
            .location(request.getLocation())
            .priority(request.getPriority())
            .contactDetails(request.getContactDetails())
            .status(TicketStatus.OPEN)
            .createdBy(currentUser)
            .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket #{} created by user {}", ticket.getId(), currentUser.getEmail());
        return toResponse(ticket, currentUser);
    }

    // ── READ (with filters) ─────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getTickets(TicketStatus status, TicketPriority priority,
                                            String category, String search, Pageable pageable) {
        User currentUser = securityUtils.getCurrentUser();

        Page<Ticket> page;

        // Full-text search takes precedence
        if (search != null && !search.isBlank()) {
            page = ticketRepository.searchTickets(search.trim(), pageable);
        } else if (currentUser.getRole() == Role.USER) {
            // Regular users see only their own tickets
            if (status != null) {
                page = ticketRepository.findByCreatedByAndStatus(currentUser, status, pageable);
            } else {
                page = ticketRepository.findByCreatedBy(currentUser, pageable);
            }
        } else if (currentUser.getRole() == Role.TECHNICIAN) {
            // Technicians see tickets assigned to them
            if (status != null) {
                page = ticketRepository.findByAssignedToAndStatus(currentUser, status, pageable);
            } else {
                page = ticketRepository.findByAssignedTo(currentUser, pageable);
            }
        } else {
            // ADMIN sees all
            if (status != null && priority != null) {
                page = ticketRepository.findByStatusAndPriority(status, priority, pageable);
            } else if (status != null) {
                page = ticketRepository.findByStatus(status, pageable);
            } else if (priority != null) {
                page = ticketRepository.findByPriority(priority, pageable);
            } else {
                page = ticketRepository.findAll(pageable);
            }
        }

        return page.map(t -> toResponse(t, currentUser));
    }

    // ── READ BY ID ─────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Ticket ticket = findTicketById(id);
        enforceReadAccess(ticket, currentUser);
        return toResponse(ticket, currentUser);
    }

    // ── UPDATE STATUS (state machine) ──────────────────────────────────────────
    @Override
    @Transactional
    public TicketResponse updateStatus(Long ticketId, UpdateStatusRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Ticket ticket = findTicketById(ticketId);

        TicketStatus from = ticket.getStatus();
        TicketStatus to = request.getNewStatus();

        // Validate transition
        if (!VALID_TRANSITIONS.getOrDefault(from, Collections.emptySet()).contains(to)) {
            throw new InvalidStateTransitionException(from.name(), to.name());
        }

        // Role-based gate
        switch (to) {
            case IN_PROGRESS -> {
                if (currentUser.getRole() != Role.ADMIN) {
                    throw new UnauthorizedException("Only ADMIN can move a ticket to IN_PROGRESS");
                }
            }
            case RESOLVED -> {
                if (currentUser.getRole() != Role.TECHNICIAN) {
                    throw new UnauthorizedException("Only the assigned TECHNICIAN can resolve a ticket");
                }
                if (ticket.getAssignedTo() == null ||
                    !ticket.getAssignedTo().getId().equals(currentUser.getId())) {
                    throw new UnauthorizedException("You are not the assigned technician for this ticket");
                }
                if (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank()) {
                    throw new IllegalArgumentException("Resolution notes are required when resolving a ticket");
                }
                ticket.setResolutionNotes(request.getResolutionNotes());
            }
            case REJECTED -> {
                if (currentUser.getRole() != Role.ADMIN) {
                    throw new UnauthorizedException("Only ADMIN can reject tickets");
                }
                if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                    throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
                }
                ticket.setRejectionReason(request.getRejectionReason());
            }
            case CLOSED -> {
                boolean isAdmin = currentUser.getRole() == Role.ADMIN;
                boolean isCreator = ticket.getCreatedBy().getId().equals(currentUser.getId());
                if (!isAdmin && !isCreator) {
                    throw new UnauthorizedException("Only ADMIN or the ticket creator can close a ticket");
                }
            }
        }

        ticket.setStatus(to);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket #{} status changed from {} to {} by {}", ticketId, from, to, currentUser.getEmail());

        // Async notification to ticket creator (if not the one making the change)
        if (!ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            notificationService.notifyStatusChange(ticketId, ticket.getCreatedBy(), to.name());
        }

        return toResponse(ticket, currentUser);
    }

    // ── ASSIGN TECHNICIAN ──────────────────────────────────────────────────────
    @Override
    @Transactional
    public TicketResponse assignTechnician(Long ticketId, AssignTechnicianRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN can assign technicians");
        }

        Ticket ticket = findTicketById(ticketId);

        User technician = userRepository.findById(request.getTechnicianId())
            .orElseThrow(() -> new ResourceNotFoundException("User", request.getTechnicianId()));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new UnauthorizedException("Target user is not a TECHNICIAN");
        }

        ticket.setAssignedTo(technician);
        // Auto-transition to IN_PROGRESS if still OPEN
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        ticket = ticketRepository.save(ticket);
        log.info("Ticket #{} assigned to technician {}", ticketId, technician.getEmail());

        // Notify the technician
        notificationService.notifyAssignment(ticketId, technician, ticket.getTitle());

        return toResponse(ticket, currentUser);
    }

    // ── UPLOAD ATTACHMENTS ─────────────────────────────────────────────────────
    @Override
    @Transactional
    public List<TicketResponse.AttachmentSummary> uploadAttachments(Long ticketId, List<MultipartFile> files) {
        User currentUser = securityUtils.getCurrentUser();
        Ticket ticket = findTicketById(ticketId);
        enforceReadAccess(ticket, currentUser);

        long existing = attachmentRepository.countByTicket(ticket);
        if (existing + files.size() > maxFilesPerTicket) {
            throw new FileStorageException(
                String.format("Cannot upload %d files. Maximum %d attachments per ticket (currently has %d)",
                    files.size(), maxFilesPerTicket, existing)
            );
        }

        List<TicketResponse.AttachmentSummary> result = new ArrayList<>();
        String subDir = "tickets/" + ticketId;

        for (MultipartFile file : files) {
            String storedPath = fileStorageService.store(file, subDir);

            Attachment attachment = Attachment.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedPath.substring(storedPath.lastIndexOf('/') + 1))
                .storedPath(storedPath)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .ticket(ticket)
                .build();

            attachment = attachmentRepository.save(attachment);
            result.add(toAttachmentSummary(attachment));
        }

        log.info("Uploaded {} attachments to ticket #{}", files.size(), ticketId);
        return result;
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteTicket(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN can delete tickets");
        }

        Ticket ticket = findTicketById(id);

        // Clean up stored files
        ticket.getAttachments().forEach(a -> fileStorageService.delete(a.getStoredPath()));

        ticketRepository.delete(ticket);
        log.info("Ticket #{} deleted by {}", id, currentUser.getEmail());
    }

    // ── MAPPING HELPERS ────────────────────────────────────────────────────────

    private TicketResponse toResponse(Ticket ticket, User currentUser) {
        long commentCount = commentRepository.countByTicket(ticket);

        return TicketResponse.builder()
            .id(ticket.getId())
            .title(ticket.getTitle())
            .description(ticket.getDescription())
            .category(ticket.getCategory())
            .location(ticket.getLocation())
            .contactDetails(ticket.getContactDetails())
            .status(ticket.getStatus())
            .priority(ticket.getPriority())
            .rejectionReason(ticket.getRejectionReason())
            .resolutionNotes(ticket.getResolutionNotes())
            .createdBy(toUserSummary(ticket.getCreatedBy()))
            .assignedTo(ticket.getAssignedTo() != null ? toUserSummary(ticket.getAssignedTo()) : null)
            .commentCount(commentCount)
            .attachments(ticket.getAttachments().stream().map(this::toAttachmentSummary).toList())
            .createdAt(ticket.getCreatedAt())
            .updatedAt(ticket.getUpdatedAt())
            .build();
    }

    private TicketResponse.UserSummary toUserSummary(User user) {
        return TicketResponse.UserSummary.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }

    private TicketResponse.AttachmentSummary toAttachmentSummary(Attachment a) {
        return TicketResponse.AttachmentSummary.builder()
            .id(a.getId())
            .originalFileName(a.getOriginalFileName())
            .contentType(a.getContentType())
            .fileSize(a.getFileSize())
            .downloadUrl("/api/tickets/" + a.getTicket().getId() + "/attachments/" + a.getId())
            .build();
    }

    private Ticket findTicketById(Long id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
    }

    private void enforceReadAccess(Ticket ticket, User user) {
        if (user.getRole() == Role.USER && !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedException("You do not have access to this ticket");
        }
        if (user.getRole() == Role.TECHNICIAN &&
            (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(user.getId()))) {
            throw new UnauthorizedException("This ticket is not assigned to you");
        }
    }
}
