package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.ReportService;
import com.project.BillX.service.WeeklyReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('MANAGER')")
public class ReportController {

    private final ReportService reportService;
    private final WeeklyReportService weeklyReportService;

    public ReportController(ReportService reportService,
                            WeeklyReportService weeklyReportService) {
        this.reportService = reportService;
        this.weeklyReportService = weeklyReportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<OverviewResponse>> getOverview(@RequestParam("branchId") Long branchId) {
        OverviewResponse response = reportService.getOverview(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Overview retrieved successfully"));
    }

    @GetMapping("/payment-breakdown")
    public ResponseEntity<ApiResponse<List<ReportDataPoint>>> getPaymentBreakdown(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "range", required = false) String range) {
        List<ReportDataPoint> response = reportService.getPaymentBreakdown(branchId, range);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment breakdown retrieved successfully"));
    }

    @GetMapping("/sales-trend")
    public ResponseEntity<ApiResponse<List<ReportDataPoint>>> getSalesTrend(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "range", required = false) String range) {
        List<ReportDataPoint> response = reportService.getSalesTrend(branchId, range);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales trend retrieved successfully"));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<ReportDataPoint>>> getTopProducts(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "limit", defaultValue = "5") Integer limit) {
        List<ReportDataPoint> response = reportService.getTopProducts(branchId, limit);
        return ResponseEntity.ok(ApiResponse.success(response, "Top products retrieved successfully"));
    }

    @GetMapping("/cashier-performance")
    public ResponseEntity<ApiResponse<List<ReportDataPoint>>> getCashierPerformance(@RequestParam("branchId") Long branchId) {
        List<ReportDataPoint> response = reportService.getCashierPerformance(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cashier performance retrieved successfully"));
    }

    @GetMapping("/sales-by-category")
    public ResponseEntity<ApiResponse<List<ReportDataPoint>>> getSalesByCategory(@RequestParam("branchId") Long branchId) {
        List<ReportDataPoint> response = reportService.getSalesByCategory(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales by category retrieved successfully"));
    }

    @GetMapping("/refund-spikes")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getRefundSpikes(@RequestParam("branchId") Long branchId) {
        List<AlertResponse> response = reportService.getRefundSpikes(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Refund spikes retrieved successfully"));
    }

    @PostMapping("/weekly/generate")
    public ResponseEntity<ApiResponse<WeeklyReportResponse>> generateWeeklyReport(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        LocalDate finalEnd = end != null ? end : LocalDate.now().minusDays(1);
        LocalDate finalStart = start != null ? start : finalEnd.minusDays(6);

        WeeklyReportResponse response = weeklyReportService.generateAndMailReport(branchId, finalStart, finalEnd);
        return ResponseEntity.ok(ApiResponse.success(response, "Weekly report generated and emailed successfully"));
    }

    @GetMapping("/weekly/history")
    public ResponseEntity<ApiResponse<List<WeeklyReportResponse>>> getWeeklyReportHistory(@RequestParam("branchId") Long branchId) {
        List<WeeklyReportResponse> response = weeklyReportService.getHistory(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Weekly report history retrieved successfully"));
    }

    @GetMapping("/weekly/download/{id}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        byte[] pdfBytes = weeklyReportService.getWeeklyReportPdf(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "WeeklyReport_" + id + ".pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }
}
