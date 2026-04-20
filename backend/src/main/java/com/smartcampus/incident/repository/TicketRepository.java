package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.Ticket;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.SlaStatus;
import com.smartcampus.incident.enums.TicketPriority;
import com.smartcampus.incident.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findAllByStatusInAndSlaStatus(List<TicketStatus> statuses, SlaStatus slaStatus);

    long countBySlaStatus(SlaStatus slaStatus);

    @Query("SELECT AVG(t.ttfrDuration) FROM Ticket t WHERE t.ttfrDuration IS NOT NULL")
    Double findAverageTtfrSeconds();

    @Query("SELECT AVG(t.ttrDuration) FROM Ticket t WHERE t.ttrDuration IS NOT NULL")
    Double findAverageTtrSeconds();

    // User's own tickets with optional filters
    Page<Ticket> findByCreatedBy(User createdBy, Pageable pageable);

    Page<Ticket> findByCreatedByAndStatus(User createdBy, TicketStatus status, Pageable pageable);

    // Admin/Technician - all tickets with filters
    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);

    // Assigned to a specific technician
    Page<Ticket> findByAssignedTo(User technician, Pageable pageable);

    Page<Ticket> findByAssignedToAndStatus(User technician, TicketStatus status, Pageable pageable);

    // Full-text search across title/description/location
    @Query("SELECT t FROM Ticket t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.location) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Ticket> searchTickets(@Param("q") String query, Pageable pageable);

    // Dashboard stats
    long countByStatus(TicketStatus status);

    long countByCreatedByAndStatus(User createdBy, TicketStatus status);

    @Query("SELECT t.category, COUNT(t) FROM Ticket t GROUP BY t.category")
    List<Object[]> countByCategory();
}
