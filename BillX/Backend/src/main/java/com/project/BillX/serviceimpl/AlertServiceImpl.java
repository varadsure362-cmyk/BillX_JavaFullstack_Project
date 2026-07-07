package com.project.BillX.serviceimpl;

import com.project.BillX.model.Alert;
import com.project.BillX.dto.*;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.AlertRepository;
import com.project.BillX.service.AlertService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final BranchAccessValidator branchAccessValidator;

    public AlertServiceImpl(AlertRepository alertRepository,
                            BranchAccessValidator branchAccessValidator) {
        this.alertRepository = alertRepository;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getUnreadAlerts(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        return alertRepository.findByBranchIdAndIsReadFalse(branchId).stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getAllAlerts(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        return alertRepository.findByBranchId(branchId).stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AlertResponse markAsRead(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with ID: " + alertId));

        branchAccessValidator.validateBranchAccess(alert.getBranch().getId());

        alert.setIsRead(true);
        Alert savedAlert = alertRepository.save(alert);
        return mapToAlertResponse(savedAlert);
    }

    private AlertResponse mapToAlertResponse(Alert alert) {
        if (alert == null) return null;
        return AlertResponse.builder()
                .id(alert.getId())
                .branchId(alert.getBranch().getId())
                .branchName(alert.getBranch().getName())
                .type(alert.getType().name())
                .message(alert.getMessage())
                .referenceId(alert.getReferenceId())
                .isRead(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
