package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.Comment;
import com.smartcampus.incident.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTicketOrderByCreatedAtAsc(Ticket ticket);

    long countByTicket(Ticket ticket);
}
