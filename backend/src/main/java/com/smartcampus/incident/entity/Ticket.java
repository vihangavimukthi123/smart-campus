package com.smartcampus.incident.entity;

import com.smartcampus.incident.enums.TicketPriority;
import com.smartcampus.incident.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Core aggregate root of the Incident module.
 * Owns the lifecycle state machine and relationships to comments and attachments.
 */
@Entity
@Table(name = "tickets", indexes = {
    @Index(name = "idx_ticket_status", columnList = "status"),
    @Index(name = "idx_ticket_priority", columnList = "priority"),
    @Index(name = "idx_ticket_created_by", columnList = "created_by_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(length = 200)
    private String contactDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    /** Filled when ADMIN rejects a ticket */
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    /** Filled by technician upon resolution */
    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    // --- Relationships ---

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    // --- Audit ---

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // --- Helper ---

    public void addComment(Comment comment) {
        comments.add(comment);
        comment.setTicket(this);
    }

    public void addAttachment(Attachment attachment) {
        attachments.add(attachment);
        attachment.setTicket(this);
    }
}
