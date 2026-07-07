package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<RefundResponse>> processRefund(@Valid @RequestBody RefundRequest request) {
        RefundResponse response = refundService.processRefund(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Refund processed successfully"));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<RefundResponse>>> getRefundsByOrderId(@PathVariable Long orderId) {
        List<RefundResponse> response = refundService.getRefundsByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Refunds retrieved successfully"));
    }
}
