package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.auth.*;
import com.smartcampus.incident.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register and login endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive a JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-otp")
public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String, String> request) {
    try {
        String email = request.get("email");
        String otp = request.get("otp");

        String message = authService.verifyOtp(request.get("email"), request.get("otp"));
        // Map ekak widihata return karanna JSON wenna
        return ResponseEntity.ok().body(java.util.Map.of("message", message));
    } catch (Exception e) {
        return ResponseEntity.status(401).body(java.util.Map.of("error", e.getMessage()));
    }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody java.util.Map<String, String> request) {
    try {
        String message = authService.resendOtp(request.get("email"));
        return ResponseEntity.ok().body(java.util.Map.of("message", message));
    } catch (Exception e) {
        return ResponseEntity.status(400).body(java.util.Map.of("error", e.getMessage()));
    }
}
}
