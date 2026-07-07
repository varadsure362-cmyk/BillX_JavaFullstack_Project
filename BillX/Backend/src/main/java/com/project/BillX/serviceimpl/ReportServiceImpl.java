package com.project.BillX.serviceimpl;

import com.project.BillX.model.AlertType;
import com.project.BillX.dto.*;
import com.project.BillX.repository.*;
import com.project.BillX.service.ReportService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AlertRepository alertRepository;
    private final BranchAccessValidator branchAccessValidator;

    public ReportServiceImpl(OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             PaymentRepository paymentRepository,
                             RefundRepository refundRepository,
                             AlertRepository alertRepository,
                             BranchAccessValidator branchAccessValidator) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.alertRepository = alertRepository;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public OverviewResponse getOverview(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);

        BigDecimal totalRevenue = orderRepository.getTotalRevenueByBranch(branchId);
        Long totalOrders = orderRepository.getOrderCountByBranch(branchId);
        BigDecimal totalRefunds = refundRepository.getTotalRefundsByBranch(branchId);
        BigDecimal averageOrderValue = orderRepository.getAverageOrderValueByBranch(branchId);

        return OverviewResponse.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders != null ? totalOrders : 0L)
                .totalRefunds(totalRefunds != null ? totalRefunds : BigDecimal.ZERO)
                .averageOrderValue(averageOrderValue != null ? averageOrderValue : BigDecimal.ZERO)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDataPoint> getPaymentBreakdown(Long branchId, String range) {
        branchAccessValidator.validateBranchAccess(branchId);
        List<Object[]> rawData = paymentRepository.getPaymentBreakdown(branchId);
        List<ReportDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            result.add(ReportDataPoint.builder()
                    .label(row[0].toString())
                    .value((BigDecimal) row[1])
                    .count((Long) row[2])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDataPoint> getSalesTrend(Long branchId, String range) {
        branchAccessValidator.validateBranchAccess(branchId);

        LocalDateTime startDate = LocalDateTime.now().minusDays(7); // default weekly
        if ("daily".equalsIgnoreCase(range)) {
            startDate = LocalDateTime.now().minusDays(1);
        } else if ("monthly".equalsIgnoreCase(range)) {
            startDate = LocalDateTime.now().minusDays(30);
        }

        List<Object[]> rawData = orderRepository.getSalesTrendDaily(branchId, startDate);
        List<ReportDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            result.add(ReportDataPoint.builder()
                    .label(row[0].toString())
                    .value((BigDecimal) row[1])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDataPoint> getTopProducts(Long branchId, Integer limit) {
        branchAccessValidator.validateBranchAccess(branchId);
        int finalLimit = limit != null ? limit : 5;
        List<Object[]> rawData = orderItemRepository.getTopProducts(branchId, PageRequest.of(0, finalLimit));
        List<ReportDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            result.add(ReportDataPoint.builder()
                    .label((String) row[0])
                    .count((Long) row[2])
                    .value((BigDecimal) row[1])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDataPoint> getCashierPerformance(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        List<Object[]> rawData = orderRepository.getCashierPerformance(branchId);
        List<ReportDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            result.add(ReportDataPoint.builder()
                    .label((String) row[0])
                    .value((BigDecimal) row[1])
                    .count((Long) row[2])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDataPoint> getSalesByCategory(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        List<Object[]> rawData = orderItemRepository.getSalesByCategory(branchId);
        List<ReportDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            result.add(ReportDataPoint.builder()
                    .label((String) row[0])
                    .value((BigDecimal) row[1])
                    .count((Long) row[2])
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getRefundSpikes(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        return alertRepository.findByBranchIdAndType(branchId, AlertType.REFUND_SPIKE).stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    private AlertResponse mapToAlertResponse(com.project.BillX.model.Alert alert) {
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
