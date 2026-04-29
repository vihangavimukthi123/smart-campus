package com.smartcampus.incident.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(email);

        // Set token in a cookie accessible to JS
        Cookie cookie = new Cookie("oauth2_auth_token", token);
        cookie.setPath("/");
        cookie.setMaxAge(60); // 60 seconds is enough to be read by the frontend
        cookie.setHttpOnly(false); // MUST be false so JS can read it
        response.addCookie(cookie);

        // Redirect to frontend (no token in URL)
        getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/auth/success");
    }
}
