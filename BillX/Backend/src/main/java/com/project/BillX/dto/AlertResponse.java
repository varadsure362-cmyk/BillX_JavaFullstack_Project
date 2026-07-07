package com.project.BillX.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private String type;
    private String message;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
