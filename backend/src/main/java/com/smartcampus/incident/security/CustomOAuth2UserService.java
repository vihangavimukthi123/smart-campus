package com.smartcampus.incident.security;

import java.util.Optional;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.smartcampus.incident.enums.Role;
import com.smartcampus.incident.entity.User;
import com.smartcampus.incident.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository; 
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        //get details from Google response
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // check if the email already exists in the database
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            
            //if its a new user, create a new user record in the database
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setProfilePictureUrl(picture); 
            newUser.setRole(Role.USER); // Default role is User
            newUser.setPassword(""); // no need for the password since we are using Google authentication
            newUser.setActive(true);
            newUser.setVerified(true); // Mark the user as verified since they authenticated through Google
            userRepository.save(newUser);
        } else {
            // Existing user: ensure they are marked as verified since they used Google
            User existingUser = userOptional.get();
            boolean changed = false;
            
            if (!existingUser.isVerified()) {
                existingUser.setVerified(true);
                changed = true;
            }
            
            if (existingUser.getProfilePictureUrl() == null && picture != null) {
                existingUser.setProfilePictureUrl(picture);
                changed = true;
            }
            
            if (changed) {
                userRepository.save(existingUser);
            }
        }

        return oAuth2User;
    }
}