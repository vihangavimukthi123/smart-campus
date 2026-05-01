package com.smartcampus.incident.dto.user;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private String department;
    private String email;
    private String profilePictureUrl;
    private Boolean soundNotify;
    private Boolean emailNotify;
}