package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.comment.CommentResponse;
import com.smartcampus.incident.dto.comment.CreateCommentRequest;

import java.util.List;

public interface CommentService {
    CommentResponse addComment(Long ticketId, CreateCommentRequest request);
    CommentResponse updateComment(Long ticketId, Long commentId, CreateCommentRequest request);
    void deleteComment(Long ticketId, Long commentId);
    List<CommentResponse> getComments(Long ticketId);
}
