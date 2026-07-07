package com.project.BillX.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private Long branchId;
    private LocalDateTime createdAt;
}
