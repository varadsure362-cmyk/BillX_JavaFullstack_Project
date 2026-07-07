package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody CreateBranchRequest request) {
        BranchResponse response = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Branch created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAllBranches() {
        List<BranchResponse> response = branchService.getAllBranches();
        return ResponseEntity.ok(ApiResponse.success(response, "Branches retrieved successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<BranchResponse>> getBranchById(@PathVariable Long id) {
        BranchResponse response = branchService.getBranchById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Branch retrieved successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranch(@PathVariable Long id,
                                                                   @Valid @RequestBody CreateBranchRequest request) {
        BranchResponse response = branchService.updateBranch(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Branch updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Branch deleted successfully"));
    }

    @PutMapping("/{id}/razorpay")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RazorpayConnectResponse>> connectRazorpay(
            @PathVariable Long id,
            @Valid @RequestBody RazorpayConnectRequest request) {
        RazorpayConnectResponse response = branchService.connectRazorpay(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Razorpay connected successfully"));
    }

    @GetMapping("/{id}/razorpay/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'CASHIER')")
    public ResponseEntity<ApiResponse<RazorpayStatusResponse>> getRazorpayStatus(@PathVariable Long id) {
        RazorpayStatusResponse response = branchService.getRazorpayStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Razorpay status retrieved successfully"));
    }
}
