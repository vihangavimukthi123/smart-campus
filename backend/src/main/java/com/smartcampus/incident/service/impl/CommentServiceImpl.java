package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.comment.*;
import com.smartcampus.incident.entity.*;
import com.smartcampus.incident.enums.Role;
import com.smartcampus.incident.exception.*;
import com.smartcampus.incident.repository.*;
import com.smartcampus.incident.service.CommentService;
import com.smartcampus.incident.service.NotificationService;
import com.smartcampus.incident.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public CommentResponse addComment(Long ticketId, CreateCommentRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Ticket ticket = findTicket(ticketId);

        Comment comment = Comment.builder()
            .content(request.getContent())
            .ticket(ticket)
            .author(currentUser)
            .build();

        comment = commentRepository.save(comment);
        log.info("Comment added to ticket #{} by {}", ticketId, currentUser.getEmail());

        // Notify the ticket owner if someone else commented
        if (!ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            notificationService.notifyNewComment(ticketId, ticket.getCreatedBy(), currentUser.getName());
        }
        // Notify the assigned technician if they're different from commenter and creator
        if (ticket.getAssignedTo() != null &&
            !ticket.getAssignedTo().getId().equals(currentUser.getId()) &&
            !ticket.getAssignedTo().getId().equals(ticket.getCreatedBy().getId())) {
            notificationService.notifyNewComment(ticketId, ticket.getAssignedTo(), currentUser.getName());
        }

        // Notify Admins
        java.util.List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            if (!admin.getId().equals(currentUser.getId()) &&
                !admin.getId().equals(ticket.getCreatedBy().getId()) &&
                (ticket.getAssignedTo() == null || !admin.getId().equals(ticket.getAssignedTo().getId()))) {
                notificationService.notifyNewComment(ticketId, admin, currentUser.getName());
            }
        }

        return toResponse(comment, currentUser);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long ticketId, Long commentId, CreateCommentRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Comment comment = findComment(commentId, ticketId);
        enforceOwnership(comment, currentUser);

        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);
        log.info("Comment #{} updated by {}", commentId, currentUser.getEmail());
        return toResponse(comment, currentUser);
    }

    @Override
    @Transactional
    public void deleteComment(Long ticketId, Long commentId) {
        User currentUser = securityUtils.getCurrentUser();
        Comment comment = findComment(commentId, ticketId);
        // ADMINs can also delete any comment
        if (currentUser.getRole() != Role.ADMIN) {
            enforceOwnership(comment, currentUser);
        }
        commentRepository.delete(comment);
        log.info("Comment #{} deleted by {}", commentId, currentUser.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long ticketId) {
        User currentUser = securityUtils.getCurrentUser();
        Ticket ticket = findTicket(ticketId);
        return commentRepository.findByTicketOrderByCreatedAtAsc(ticket)
            .stream()
            .map(c -> toResponse(c, currentUser))
            .toList();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void enforceOwnership(Comment comment, User user) {
        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only edit or delete your own comments");
        }
    }

    private Ticket findTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId));
    }

    private Comment findComment(Long commentId, Long ticketId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment " + commentId + " does not belong to ticket " + ticketId);
        }
        return comment;
    }

    private CommentResponse toResponse(Comment comment, User currentUser) {
        return CommentResponse.builder()
            .id(comment.getId())
            .content(comment.getContent())
            .ticketId(comment.getTicket().getId())
            .author(CommentResponse.AuthorSummary.builder()
                .id(comment.getAuthor().getId())
                .name(comment.getAuthor().getName())
                .role(comment.getAuthor().getRole().name())
                .build())
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .editable(comment.getAuthor().getId().equals(currentUser.getId()))
            .build();
    }
}
