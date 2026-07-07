package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.time.LocalDate;
import java.util.List;

public interface WeeklyReportService {
    WeeklyReportResponse generateAndMailReport(Long branchId, LocalDate start, LocalDate end);
    List<WeeklyReportResponse> getHistory(Long branchId);
    byte[] getWeeklyReportPdf(Long id);
    void runWeeklyScheduler();
}
