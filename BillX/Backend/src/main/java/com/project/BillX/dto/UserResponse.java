package com.project.BillX.dto;

import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String authProvider;
    private Long branchId;
    private String branchName;
    private Set<Long> managedBranchIds;
}
