package com.project.BillX.service;

import com.project.BillX.dto.*;
public interface AuthService {
    AuthResponse signup(SignupRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getMe();
}
