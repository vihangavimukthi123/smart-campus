package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.user.UpdateProfileRequest;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.UserRepository;
import com.smartcampus.incident.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void updateMyProfile(UpdateProfileRequest request) {
        // 1. දැනට ලොග් වෙලා ඉන්න කෙනාගේ Email එක ගන්නවා
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. ඒ Email එකෙන් User ව හොයාගන්නවා
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Entity එකේ විස්තර update කරනවා
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setDepartment(request.getDepartment());
        user.setProfilePictureUrl(request.getProfilePictureUrl());
        user.setSoundNotify(request.isSoundNotify());
        user.setEmailNotify(request.isEmailNotify());

        // 4. Save කරනවා
        userRepository.save(user);
    }
}