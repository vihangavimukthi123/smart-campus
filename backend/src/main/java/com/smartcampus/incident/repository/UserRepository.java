package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    //find user by email
    Optional<User> findByEmail(String email);

    //does email already exist
    boolean existsByEmail(String email);

    //find users by role
    List<User> findByRole(Role role);

    //find active users
    List<User> findByRoleAndActiveTrue(Role role);

    //find user by OTP
    Optional<User> findByOtp(String otp);
}
