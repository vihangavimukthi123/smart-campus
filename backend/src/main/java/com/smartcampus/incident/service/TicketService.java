package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.ticket.*;
import com.smartcampus.incident.enums.TicketPriority;
import com.smartcampus.incident.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(CreateTicketRequest request);

    Page<TicketResponse> getTickets(TicketStatus status, TicketPriority priority,
                                    String category, String search, Pageable pageable);

    TicketResponse getTicketById(Long id);

    TicketResponse updateStatus(Long ticketId, UpdateStatusRequest request);

    TicketResponse assignTechnician(Long ticketId, AssignTechnicianRequest request);

    List<TicketResponse.AttachmentSummary> uploadAttachments(Long ticketId, List<MultipartFile> files);

    void deleteTicket(Long id);
}
