package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasRole('MANAGER')")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        UserResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Employee registered successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getEmployees(@RequestParam(required = false) Long branchId) {
        List<UserResponse> response = employeeService.getEmployees(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Employees retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateEmployee(@PathVariable Long id,
                                                                   @Valid @RequestBody CreateEmployeeRequest request) {
        UserResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Employee profile updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Employee profile deleted successfully"));
    }
}
