package com.project.BillX.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrPaymentRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;
}
