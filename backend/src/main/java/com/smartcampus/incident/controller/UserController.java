package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.ticket.TicketResponse;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.Role;
import com.smartcampus.incident.enums.TicketStatus;
import com.smartcampus.incident.repository.TicketRepository;
import com.smartcampus.incident.repository.UserRepository;
import com.smartcampus.incident.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management (ADMIN only)")
public class UserController {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/technicians")
    @Operation(summary = "List all active technicians (ADMIN only)")
    public ResponseEntity<List<Map<String, Object>>> getTechnicians() {
        List<User> technicians = userRepository.findByRoleAndActiveTrue(Role.TECHNICIAN);
        List<Map<String, Object>> result = technicians.stream().map(t -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("name", t.getName());
            map.put("email", t.getEmail());
            map.put("department", t.getDepartment());
            long assigned = ticketRepository.findByAssignedTo(t,
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
            map.put("assignedTickets", assigned);
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<Map<String, Object>> getMe() {
        User user = securityUtils.getCurrentUser();
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("phone", user.getPhone());
        profile.put("department", user.getDepartment());
        profile.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(profile);
    }
}
