package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.comment.*;
import com.smartcampus.incident.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets/{ticketId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comment thread management for tickets")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addComment(ticketId, request));
    }

    @GetMapping
    @Operation(summary = "Get all comments for a ticket")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getComments(ticketId));
    }

    @PutMapping("/{commentId}")
    @Operation(summary = "Edit a comment (owner only)")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(commentService.updateComment(ticketId, commentId, request));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete a comment (owner or ADMIN)")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId) {
        commentService.deleteComment(ticketId, commentId);
        return ResponseEntity.noContent().build();
    }
}
