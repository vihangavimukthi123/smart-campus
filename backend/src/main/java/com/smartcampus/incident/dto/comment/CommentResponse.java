package com.smartcampus.incident.dto.comment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {

    private Long id;
    private String content;
    private Long ticketId;
    private AuthorSummary author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean editable; // true if the current user is the author

    @Data
    @Builder
    public static class AuthorSummary {
        private Long id;
        private String name;
        private String role;
    }
}
