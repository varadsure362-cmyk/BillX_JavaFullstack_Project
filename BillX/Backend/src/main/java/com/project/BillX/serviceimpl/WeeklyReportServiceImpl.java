package com.project.BillX.serviceimpl;

import com.project.BillX.model.*;
import com.project.BillX.dto.*;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.*;
import com.project.BillX.service.ReportService;
import com.project.BillX.service.WeeklyReportService;
import com.project.BillX.util.BranchAccessValidator;
import com.project.BillX.util.PdfReportGenerator;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WeeklyReportServiceImpl implements WeeklyReportService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final RefundRepository refundRepository;
    private final ReportService reportService;
    private final PdfReportGenerator pdfReportGenerator;
    private final JavaMailSender mailSender;
    private final BranchAccessValidator branchAccessValidator;

    @Value("${spring.mail.username}")
    private String mailUsername;

    public WeeklyReportServiceImpl(WeeklyReportRepository weeklyReportRepository,
                                   BranchRepository branchRepository,
                                   UserRepository userRepository,
                                   ProductRepository productRepository,
                                   OrderRepository orderRepository,
                                   RefundRepository refundRepository,
                                   ReportService reportService,
                                   PdfReportGenerator pdfReportGenerator,
                                   JavaMailSender mailSender,
                                   BranchAccessValidator branchAccessValidator) {
        this.weeklyReportRepository = weeklyReportRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.refundRepository = refundRepository;
        this.reportService = reportService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.mailSender = mailSender;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public WeeklyReportResponse generateAndMailReport(Long branchId, LocalDate start, LocalDate end) {
        // Security check for manager access
        branchAccessValidator.validateBranchAccess(branchId);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        log.info("Generating weekly report for Branch: {}, start: {}, end: {}", branchId, start, end);

        // Fetch Aggregated data
        BigDecimal totalRevenue = orderRepository.getTotalRevenueByBranch(branchId);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Long orderCount = orderRepository.getOrderCountByBranch(branchId);
        if (orderCount == null) orderCount = 0L;

        BigDecimal totalRefunds = refundRepository.getTotalRefundsByBranch(branchId);
        if (totalRefunds == null) totalRefunds = BigDecimal.ZERO;

        List<ReportDataPoint> paymentBreakdown = reportService.getPaymentBreakdown(branchId, "weekly");
        List<ReportDataPoint> topProducts = reportService.getTopProducts(branchId, 5);
        List<ReportDataPoint> cashierPerformance = reportService.getCashierPerformance(branchId);
        List<ReportDataPoint> categorySales = reportService.getSalesByCategory(branchId);
        List<Product> lowStockProducts = productRepository.findByBranchId(branchId).stream()
                .filter(p -> p.getStockQuantity() < p.getLowStockThreshold())
                .collect(Collectors.toList());

        // Generate PDF
        byte[] pdfBytes = pdfReportGenerator.generateWeeklyReportPdf(
                branch, start, end, totalRevenue, orderCount, totalRefunds,
                paymentBreakdown, topProducts, cashierPerformance, categorySales, lowStockProducts
        );

        // Save PDF to Disk
        String filePath = "";
        try {
            File dir = new File("./reports");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(dir, "WeeklyReport_" + branchId + "_" + start + "_to_" + end + "_" + System.currentTimeMillis() + ".pdf");
            Files.write(file.toPath(), pdfBytes);
            filePath = file.getAbsolutePath();
        } catch (Exception e) {
            log.error("Failed to save report PDF to disk", e);
            filePath = "Temp file generation error: " + e.getMessage();
        }

        // Find Assigned Managers' Emails
        List<String> managerEmails = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MANAGER && u.getManagedBranches().stream().anyMatch(b -> b.getId().equals(branchId)))
                .map(User::getEmail)
                .collect(Collectors.toList());

        String emailedTo = String.join(", ", managerEmails);

        // Mail Delivery (with fallback try-catch)
        if (!managerEmails.isEmpty()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true);
                helper.setFrom(mailUsername);
                helper.setTo(managerEmails.toArray(new String[0]));
                helper.setSubject("Weekly Report — " + branch.getName() + " — " + start + " to " + end);
                helper.setText("Greetings,\n\nPlease find attached the weekly performance report for branch: " + branch.getName() + ".\n\nBest Regards,\nBillX System");

                helper.addAttachment("WeeklyReport_" + branchId + "_" + start + "_to_" + end + ".pdf", new ByteArrayResource(pdfBytes));
                mailSender.send(message);
                log.info("Weekly report email sent successfully to: {}", emailedTo);
            } catch (Exception e) {
                log.error("Failed to send weekly report email", e);
                emailedTo = "Failed to mail managers: " + e.getMessage() + " (Scheduled targets: " + emailedTo + ")";
            }
        } else {
            emailedTo = "No managers assigned to branch";
        }

        // Store weekly_reports entry
        WeeklyReport weeklyReport = WeeklyReport.builder()
                .branch(branch)
                .weekStartDate(start)
                .weekEndDate(end)
                .filePath(filePath)
                .emailedTo(emailedTo)
                .build();

        WeeklyReport saved = weeklyReportRepository.save(weeklyReport);

        return WeeklyReportResponse.builder()
                .id(saved.getId())
                .branchId(branch.getId())
                .branchName(branch.getName())
                .weekStartDate(saved.getWeekStartDate())
                .weekEndDate(saved.getWeekEndDate())
                .filePath(saved.getFilePath())
                .emailedTo(saved.getEmailedTo())
                .generatedAt(saved.getGeneratedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyReportResponse> getHistory(Long branchId) {
        branchAccessValidator.validateBranchAccess(branchId);
        return weeklyReportRepository.findByBranchId(branchId).stream()
                .map(wr -> WeeklyReportResponse.builder()
                        .id(wr.getId())
                        .branchId(wr.getBranch().getId())
                        .branchName(wr.getBranch().getName())
                        .weekStartDate(wr.getWeekStartDate())
                        .weekEndDate(wr.getWeekEndDate())
                        .filePath(wr.getFilePath())
                        .emailedTo(wr.getEmailedTo())
                        .generatedAt(wr.getGeneratedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void runWeeklyScheduler() {
        LocalDate end = LocalDate.now().minusDays(1); // yesterday
        LocalDate start = end.minusDays(6); // trailing 7 days

        // Process for all branches
        List<Branch> branches = branchRepository.findAll();
        for (Branch branch : branches) {
            try {
                // Find all assigned managers
                List<String> managerEmails = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.MANAGER && u.getManagedBranches().stream().anyMatch(b -> b.getId().equals(branch.getId())))
                        .map(User::getEmail)
                        .collect(Collectors.toList());

                if (managerEmails.isEmpty()) {
                    log.info("No managers assigned to branch: {}. Skipping scheduled report generation.", branch.getName());
                    continue;
                }

                // Call local method bypassing branchAccessValidator principal check (since it runs in background context)
                BigDecimal totalRevenue = orderRepository.getTotalRevenueByBranch(branch.getId());
                if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

                Long orderCount = orderRepository.getOrderCountByBranch(branch.getId());
                if (orderCount == null) orderCount = 0L;

                BigDecimal totalRefunds = refundRepository.getTotalRefundsByBranch(branch.getId());
                if (totalRefunds == null) totalRefunds = BigDecimal.ZERO;

                List<ReportDataPoint> paymentBreakdown = reportService.getPaymentBreakdown(branch.getId(), "weekly");
                List<ReportDataPoint> topProducts = reportService.getTopProducts(branch.getId(), 5);
                List<ReportDataPoint> cashierPerformance = reportService.getCashierPerformance(branch.getId());
                List<ReportDataPoint> categorySales = reportService.getSalesByCategory(branch.getId());
                List<Product> lowStockProducts = productRepository.findByBranchId(branch.getId()).stream()
                        .filter(p -> p.getStockQuantity() < p.getLowStockThreshold())
                        .collect(Collectors.toList());

                byte[] pdfBytes = pdfReportGenerator.generateWeeklyReportPdf(
                        branch, start, end, totalRevenue, orderCount, totalRefunds,
                        paymentBreakdown, topProducts, cashierPerformance, categorySales, lowStockProducts
                );

                String filePath = "";
                File dir = new File("./reports");
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                File file = new File(dir, "WeeklyReport_" + branch.getId() + "_" + start + "_to_" + end + "_" + System.currentTimeMillis() + ".pdf");
                Files.write(file.toPath(), pdfBytes);
                filePath = file.getAbsolutePath();

                String emailedTo = String.join(", ", managerEmails);

                try {
                    MimeMessage message = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(message, true);
                    helper.setFrom(mailUsername);
                    helper.setTo(managerEmails.toArray(new String[0]));
                    helper.setSubject("Weekly Report — " + branch.getName() + " — " + start + " to " + end);
                    helper.setText("Greetings,\n\nPlease find attached the weekly performance report for branch: " + branch.getName() + ".\n\nBest Regards,\nBillX System");

                    helper.addAttachment("WeeklyReport_" + branch.getId() + "_" + start + "_to_" + end + ".pdf", new ByteArrayResource(pdfBytes));
                    mailSender.send(message);
                } catch (Exception mailError) {
                    log.error("Failed to send scheduled report email", mailError);
                    emailedTo = "Failed to mail: " + mailError.getMessage();
                }

                WeeklyReport weeklyReport = WeeklyReport.builder()
                        .branch(branch)
                        .weekStartDate(start)
                        .weekEndDate(end)
                        .filePath(filePath)
                        .emailedTo(emailedTo)
                        .build();

                weeklyReportRepository.save(weeklyReport);
                log.info("Scheduled weekly report saved for branch: {}", branch.getName());

            } catch (Exception e) {
                log.error("Error generating scheduled weekly report for branch: " + branch.getId(), e);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getWeeklyReportPdf(Long id) {
        WeeklyReport report = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly report not found with id: " + id));
        branchAccessValidator.validateBranchAccess(report.getBranch().getId());
        try {
            return Files.readAllBytes(new File(report.getFilePath()).toPath());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Failed to read weekly report PDF file from disk: " + e.getMessage());
        }
    }
}
