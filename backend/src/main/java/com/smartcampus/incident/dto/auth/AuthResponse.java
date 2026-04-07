package com.smartcampus.incident.dto.auth;

import com.smartcampus.incident.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private Long expiresIn;
}
