package com.project.BillX.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBranchRequest {

    @NotBlank(message = "Branch name is required")
    @Size(max = 150, message = "Branch name cannot exceed 150 characters")
    private String name;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @Size(max = 100, message = "Working days cannot exceed 100 characters")
    private String workingDays; // e.g. "Mon,Tue,Wed,Thu,Fri,Sat"
}
