package com.smartcampus.incident.dto.user;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private String department;
    private String profilePictureUrl;
    private boolean soundNotify;
    private boolean emailNotify;
}