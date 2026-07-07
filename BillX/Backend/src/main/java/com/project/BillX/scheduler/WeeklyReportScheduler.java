package com.project.BillX.scheduler;

import com.project.BillX.service.WeeklyReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class WeeklyReportScheduler {

    private final WeeklyReportService weeklyReportService;

    public WeeklyReportScheduler(WeeklyReportService weeklyReportService) {
        this.weeklyReportService = weeklyReportService;
    }

    @Scheduled(cron = "${weekly.report.cron:0 0 6 * * MON}")
    public void generateWeeklyReports() {
        log.info("Starting scheduled weekly report generation...");
        try {
            weeklyReportService.runWeeklyScheduler();
            log.info("Scheduled weekly report generation finished successfully.");
        } catch (Exception e) {
            log.error("Scheduled weekly report generation failed", e);
        }
    }
}
