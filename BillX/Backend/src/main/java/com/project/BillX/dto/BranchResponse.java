package com.project.BillX.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchResponse {
    private Long id;
    private String name;
    private String address;
    private String workingDays;
    private LocalDateTime createdAt;
}
