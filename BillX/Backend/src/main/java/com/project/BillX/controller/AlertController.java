package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@PreAuthorize("hasRole('MANAGER')")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getUnreadAlerts(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "all", defaultValue = "false") boolean all) {
        List<AlertResponse> response = all ? alertService.getAllAlerts(branchId) : alertService.getUnreadAlerts(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Alerts retrieved successfully"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<AlertResponse>> markAsRead(@PathVariable Long id) {
        AlertResponse response = alertService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Alert marked as read"));
    }
}
