package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.auth.*;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.exception.UnauthorizedException;
import com.smartcampus.incident.repository.UserRepository;
import com.smartcampus.incident.security.JwtTokenProvider;
import com.smartcampus.incident.service.AuthService;
import com.smartcampus.incident.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Random;

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
    private final EmailService emailService;

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

        //geenrate a random 6-digit OTP for email verification 
        String otp = String.format("%06d", new Random().nextInt(999999));

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .phone(request.getPhone())
            .department(request.getDepartment())
            .active(true)        // Account active
            .verified(false)   // Not verified
            .otp(otp)            // save OTP
            .soundNotify(true) //sound notifications enabled by default
            .emailNotify(true) // email notifications enabled by default
            .otpExpiry(LocalDateTime.now().plusMinutes(5)) // Winadi 5kin expire wenawa
            .build();

        user = userRepository.save(user);
        log.info("New user registered: {} [{}]", user.getEmail(), user.getRole());

        //notification 
        emailService.sendOtpEmail(user.getEmail(), otp);

        //need to login again after registering so the account is still not verified
        return buildAuthResponse(user, null);
    }

    @Override
    @Transactional
    public String verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found with email: " + email));

        // check OTP and time
        if (user.getOtp() != null && user.getOtp().equals(otp)) {
            if (user.getOtpExpiry().isAfter(LocalDateTime.now())) {
                user.setVerified(true);
                user.setOtp(null); // delete OTP after successful verification
                user.setOtpExpiry(null);
                userRepository.save(user);
                return "Account Verified Successfully! You can now login.";
            } else {
                throw new UnauthorizedException("OTP has expired! Please request a new one.");
            }
        } else {
            throw new UnauthorizedException("Invalid OTP code!");
        }
    }

    @Override
@Transactional
public String resendOtp(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("User not found with email: " + email));

    // Aluth OTP ekak generate karanna
    String newOtp = String.format("%06d", new java.util.Random().nextInt(999999));
    
    user.setOtp(newOtp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(5)); // Ayeth winadi 5k damma
    userRepository.save(user);

    emailService.sendOtpEmail(email, newOtp);
    
    return "New OTP sent to your email!";
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!user.isVerified()){
            throw new UnauthorizedException("Account not verified! Please verify your email before logging in.");
        }

        //generate token
        String token = tokenProvider.generateToken(authentication);
        log.info("User logged in: {}", user.getEmail());

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .userId(user.getUserId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .expiresIn(tokenProvider.getExpirationMs())
            .build();
    }

}
