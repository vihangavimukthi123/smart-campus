package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.ticket.*;
import com.smartcampus.incident.entity.Attachment;
import com.smartcampus.incident.enums.*;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.repository.AttachmentRepository;
import com.smartcampus.incident.service.*;
import com.smartcampus.incident.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Incident ticket management endpoints")
public class TicketController {

    private final TicketService ticketService;
    private final FileStorageService fileStorageService;
    private final AttachmentRepository attachmentRepository;

    @PostMapping
    @Operation(summary = "Create a new incident ticket")
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request));
    }

    @GetMapping
    @Operation(summary = "List tickets (filtered by role, status, priority, search)")
    public ResponseEntity<Page<TicketResponse>> getTickets(
            @Parameter(description = "Filter by status") @RequestParam(required = false) TicketStatus status,
            @Parameter(description = "Filter by priority") @RequestParam(required = false) TicketPriority priority,
            @Parameter(description = "Filter by category") @RequestParam(required = false) String category,
            @Parameter(description = "Full-text search") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ticketService.getTickets(status, priority, category, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full details of a ticket")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update ticket status (ADMIN/TECHNICIAN only)")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request));
    }

    @PutMapping("/{id}/assign")
    @Operation(summary = "Assign a technician to a ticket (ADMIN only)")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload up to 3 images for a ticket")
    public ResponseEntity<List<TicketResponse.AttachmentSummary>> uploadAttachments(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ticketService.uploadAttachments(id, files));
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}")
    @Operation(summary = "Download/view an attachment")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId) {

        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));

        Path filePath = fileStorageService.resolveFilePath(attachment.getStoredPath());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) throw new ResourceNotFoundException("File not found on server");
        } catch (Exception e) {
            throw new ResourceNotFoundException("File could not be loaded: " + attachment.getOriginalFileName());
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(attachment.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + attachment.getOriginalFileName() + "\"")
            .body(resource);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a ticket (ADMIN only)")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
}
