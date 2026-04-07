package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.auth.*;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.exception.UnauthorizedException;
import com.smartcampus.incident.repository.UserRepository;
import com.smartcampus.incident.security.JwtTokenProvider;
import com.smartcampus.incident.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("Email address is already registered: " + request.getEmail());
        }

        // Prevent self-escalation to ADMIN via registration API
        var role = (request.getRole() == null) ? com.smartcampus.incident.enums.Role.USER : request.getRole();
        if (role == com.smartcampus.incident.enums.Role.ADMIN) {
            // ADMINs can only be created by existing ADMINs (or through DB seeding)
            role = com.smartcampus.incident.enums.Role.USER;
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .phone(request.getPhone())
            .department(request.getDepartment())
            .build();

        user = userRepository.save(user);
        log.info("New user registered: {} [{}]", user.getEmail(), user.getRole());

        String token = tokenProvider.generateToken(user.getEmail());
        return buildAuthResponse(user, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        String token = tokenProvider.generateToken(authentication);
        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .userId(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .expiresIn(tokenProvider.getExpirationMs())
            .build();
    }
}
