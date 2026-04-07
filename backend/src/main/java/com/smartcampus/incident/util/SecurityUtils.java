package com.smartcampus.incident.util;

import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Utility to retrieve the currently authenticated User entity from the DB.
 * Avoids re-querying in every service method.
 */
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Returns the full User entity for the currently authenticated principal.
     */
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;

        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = principal.toString();
        }

        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found in database"));
    }

    /**
     * Returns the email of the currently authenticated user without a DB call.
     */
    public String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        return principal.toString();
    }
}
