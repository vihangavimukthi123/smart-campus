package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.Attachment;
import com.smartcampus.incident.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByTicket(Ticket ticket);

    long countByTicket(Ticket ticket);
}
