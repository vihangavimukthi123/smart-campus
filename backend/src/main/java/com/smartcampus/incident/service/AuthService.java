package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.auth.AuthResponse;
import com.smartcampus.incident.dto.auth.LoginRequest;
import com.smartcampus.incident.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);

    String verifyOtp(String email, String otp);
    String resendOtp(String email);

    void changePassword(com.smartcampus.incident.entity.User currentUser, com.smartcampus.incident.dto.user.ChangePasswordRequest request);
}
