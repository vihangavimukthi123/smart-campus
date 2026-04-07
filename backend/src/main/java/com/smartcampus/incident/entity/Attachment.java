package com.smartcampus.incident.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stores metadata for uploaded images attached to a ticket.
 * The actual file is stored on the filesystem via FileStorageService.
 */
@Entity
@Table(name = "attachments", indexes = {
    @Index(name = "idx_attachment_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Original filename as uploaded by user */
    @Column(nullable = false, length = 255)
    private String originalFileName;

    /** UUID-based stored filename to prevent collisions */
    @Column(nullable = false, length = 255)
    private String storedFileName;

    /** Relative path within the uploads directory */
    @Column(nullable = false, length = 500)
    private String storedPath;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
