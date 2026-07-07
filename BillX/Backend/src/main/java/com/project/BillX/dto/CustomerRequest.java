package com.project.BillX.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 150, message = "Customer name cannot exceed 150 characters")
    private String fullName;

    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    private Long branchId;
}
