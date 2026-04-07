package com.smartcampus.incident.config;

import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.Role;
import com.smartcampus.incident.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds the database with an ADMIN account and a sample TECHNICIAN on first run.
 * Both accounts are skipped if the email already exists.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seed() {
        return args -> {
            seedUser(
                "Campus Administrator",
                "admin@smartcampus.edu",
                "Admin@12345",
                Role.ADMIN,
                null,
                "Administration"
            );
            seedUser(
                "John Technician",
                "tech@smartcampus.edu",
                "Tech@12345",
                Role.TECHNICIAN,
                "+911234567890",
                "Facilities"
            );
            seedUser(
                "Alice Student",
                "user@smartcampus.edu",
                "User@12345",
                Role.USER,
                "+919876543210",
                "Engineering"
            );
        };
    }

    private void seedUser(String name, String email, String rawPassword,
                          Role role, String phone, String department) {
        if (userRepository.existsByEmail(email)) {
            log.debug("Seed skipped — user already exists: {}", email);
            return;
        }
        User user = User.builder()
            .name(name)
            .email(email)
            .password(passwordEncoder.encode(rawPassword))
            .role(role)
            .phone(phone)
            .department(department)
            .active(true)
            .build();
        userRepository.save(user);
        log.info("✅ Seeded {} account: {} / {}", role, email, rawPassword);
    }
}
