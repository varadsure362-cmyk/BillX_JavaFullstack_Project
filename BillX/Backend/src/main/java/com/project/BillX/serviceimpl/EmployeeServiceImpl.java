package com.project.BillX.serviceimpl;

import com.project.BillX.model.AuthProvider;
import com.project.BillX.model.Branch;
import com.project.BillX.model.Role;
import com.project.BillX.model.User;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ForbiddenException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.repository.UserRepository;
import com.project.BillX.service.EmployeeService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchAccessValidator branchAccessValidator;

    public EmployeeServiceImpl(UserRepository userRepository,
                               BranchRepository branchRepository,
                               PasswordEncoder passwordEncoder,
                               BranchAccessValidator branchAccessValidator) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public UserResponse createEmployee(CreateEmployeeRequest request) {
        Role targetRole;
        try {
            targetRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Role must be CASHIER or MANAGER");
        }

        if (targetRole == Role.MANAGER) {
            throw new ForbiddenException("Managers cannot create other Managers");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered");
        }

        if (request.getBranchId() == null) {
            throw new BadRequestException("Branch ID is required for cashiers");
        }

        branchAccessValidator.validateBranchAccess(request.getBranchId());
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        User employee = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.CASHIER)
                .authProvider(AuthProvider.LOCAL)
                .branch(branch)
                .build();

        User savedUser = userRepository.save(employee);
        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getEmployees(Long branchId) {
        if (branchId != null) {
            branchAccessValidator.validateBranchAccess(branchId);
            return userRepository.findAllByBranchId(branchId).stream()
                    .map(this::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        // Return all cashiers in all branches managed by current manager
        Long managerId = branchAccessValidator.getCurrentUser().getId();
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        return manager.getManagedBranches().stream()
                .flatMap(b -> userRepository.findAllByBranchId(b.getId()).stream())
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateEmployee(Long id, CreateEmployeeRequest request) {
        User employee = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() == Role.MANAGER) {
            throw new ForbiddenException("Cannot modify manager profiles");
        }

        // Validate branch access of the employee's current branch
        if (employee.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(employee.getBranch().getId());
        }

        // If assigning to a new branch, validate access to the new branch
        if (request.getBranchId() != null) {
            branchAccessValidator.validateBranchAccess(request.getBranchId());
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
            employee.setBranch(branch);
        }

        employee.setFullName(request.getFullName());
        employee.setPhone(request.getPhone());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(employee);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteEmployee(Long id) {
        User employee = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() == Role.MANAGER) {
            throw new ForbiddenException("Cannot delete manager profiles");
        }

        if (employee.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(employee.getBranch().getId());
        }

        userRepository.delete(employee);
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
