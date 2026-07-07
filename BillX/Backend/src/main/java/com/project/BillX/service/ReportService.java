package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface ReportService {
    OverviewResponse getOverview(Long branchId);
    List<ReportDataPoint> getPaymentBreakdown(Long branchId, String range);
    List<ReportDataPoint> getSalesTrend(Long branchId, String range);
    List<ReportDataPoint> getTopProducts(Long branchId, Integer limit);
    List<ReportDataPoint> getCashierPerformance(Long branchId);
    List<ReportDataPoint> getSalesByCategory(Long branchId);
    List<AlertResponse> getRefundSpikes(Long branchId);
}
