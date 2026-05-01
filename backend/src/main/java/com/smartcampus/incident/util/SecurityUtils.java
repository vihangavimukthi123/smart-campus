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
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UsernameNotFoundException("No authenticated user found in security context");
        }

        Object principal = authentication.getPrincipal();
        String email;

        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String s) {
            email = s;
        } else {
            email = principal.toString();
        }

        if (email == null || email.equals("anonymousUser")) {
            throw new UsernameNotFoundException("Anonymous user is not allowed here");
        }

        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found in database: " + email));
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

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
