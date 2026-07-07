package com.project.BillX.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotBlank(message = "Refund reason is required")
    private String reason;

    @NotNull(message = "Refund amount is required")
    @DecimalMin(value = "0.01", message = "Refund amount must be positive")
    private BigDecimal amount;

    @NotEmpty(message = "Refunded item IDs are required")
    private List<Long> itemIds; // The IDs of orderItems to refund
}
