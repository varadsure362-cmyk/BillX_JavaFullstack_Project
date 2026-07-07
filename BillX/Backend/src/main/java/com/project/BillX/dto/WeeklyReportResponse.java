package com.project.BillX.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReportResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private String filePath;
    private String emailedTo;
    private LocalDateTime generatedAt;
}
