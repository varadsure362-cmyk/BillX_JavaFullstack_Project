package com.project.BillX.security;

import com.project.BillX.model.AuthProvider;
import com.project.BillX.model.Role;
import com.project.BillX.model.User;
import com.project.BillX.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                JwtProvider jwtProvider,
                                @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        if (name == null) {
            name = oAuth2User.getAttribute("given_name");
        }
        if (name == null) {
            name = "Google User";
        }

        final String finalName = name;
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .fullName(finalName)
                    .email(email)
                    .role(Role.MANAGER) // Auto-register new users as MANAGER
                    .authProvider(AuthProvider.GOOGLE)
                    .branch(null) // branch_id = NULL
                    .build();
            return userRepository.save(newUser);
        });

        String token = jwtProvider.generateToken(user);
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .fragment("token=" + token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
