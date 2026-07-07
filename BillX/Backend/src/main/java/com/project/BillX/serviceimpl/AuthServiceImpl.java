package com.project.BillX.serviceimpl;

import com.project.BillX.model.AuthProvider;
import com.project.BillX.model.Role;
import com.project.BillX.model.User;
import com.project.BillX.model.Branch;
import com.project.BillX.dto.*;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.UserRepository;
import com.project.BillX.security.JwtProvider;
import com.project.BillX.security.UserPrincipal;
import com.project.BillX.service.AuthService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;
    private final BranchAccessValidator branchAccessValidator;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtProvider jwtProvider,
                           AuthenticationManager authenticationManager,
                           BranchAccessValidator branchAccessValidator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.authenticationManager = authenticationManager;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered");
        }

        Role userRole = Role.MANAGER;
        if (request.getRole() != null) {
            try {
                userRole = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Keep default MANAGER
            }
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(userRole)
                .authProvider(AuthProvider.LOCAL)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserResponse(savedUser))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setLastLogin(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        String token = jwtProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserResponse(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMe() {
        UserPrincipal principal = branchAccessValidator.getCurrentUser();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .authProvider(user.getAuthProvider().name())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .branchName(user.getBranch() != null ? user.getBranch().getName() : null)
                .managedBranchIds(user.getManagedBranches() != null ?
                        user.getManagedBranches().stream().map(Branch::getId).collect(Collectors.toSet()) :
                        Collections.emptySet())
                .build();
    }
}
