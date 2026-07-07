package com.project.BillX.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private Long branchId;
    private String branchName;
    private LocalDateTime createdAt;
}
