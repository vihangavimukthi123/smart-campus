package com.smartcampus.incident.dto.auth;

import com.smartcampus.incident.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
    )
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[0-9]{10}$", 
        message = "Phone number must be exactly 10 digits (e.g., 0712345678)"
    )
    private String phone;

    @Size(max = 100, message = "Department name too long")
    private String department;

    /** Defaults to USER if not provided (prevents privilege escalation) */
    private Role role = Role.USER;
}
