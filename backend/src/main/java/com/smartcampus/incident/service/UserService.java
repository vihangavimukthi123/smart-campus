package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.user.UpdateProfileRequest;

public interface UserService {
    void updateMyProfile(UpdateProfileRequest request);

    void verifyAndChangeEmail(String otp, String newEmail);
}