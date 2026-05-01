package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.user.UpdateProfileRequest;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.UserRepository;
import com.smartcampus.incident.service.UserService;
import com.smartcampus.incident.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public void updateMyProfile(UpdateProfileRequest request) {
        // 1. දැනට ලොග් වෙලා ඉන්න කෙනා කවුද කියලා හොයාගන්නවා
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. ඊමේල් එක වෙනස් කරන්න හදනවා නම් විතරක් OTP එකක් යවනවා
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            String otp = String.format("%06d", new Random().nextInt(999999));
            user.setOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
            
            // ඔයාගේ EmailService එකේ තියෙන විදිහට parameters 2යි යවන්න ඕනේ
            emailService.sendOtpEmail(request.getEmail(), otp);
        }

        // 3. මෙන්න මෙතන තමයි Profile එකේ අනෙක් විස්තර Update වෙන්නේ
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setDepartment(request.getDepartment());
        user.setProfilePictureUrl(request.getProfilePictureUrl());
        user.setSoundNotify(request.isSoundNotify());
        user.setEmailNotify(request.isEmailNotify());

        // 4. Database එකේ සේව් කරනවා
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void verifyAndChangeEmail(String otp, String newEmail) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp() != null && user.getOtp().equals(otp) && 
            user.getOtpExpiry().isAfter(LocalDateTime.now())) {
            
            user.setEmail(newEmail);
            user.setOtp(null); 
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid or Expired OTP!");
        }
    }
}