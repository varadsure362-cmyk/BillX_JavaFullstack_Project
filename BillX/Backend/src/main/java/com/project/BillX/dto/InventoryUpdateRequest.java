package com.project.BillX.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryUpdateRequest {

    @NotBlank(message = "Change type is required (RESTOCK or ADJUSTMENT)")
    private String changeType;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChanged;
}
