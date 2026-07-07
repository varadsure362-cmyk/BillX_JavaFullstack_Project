package com.project.BillX.dto;

import com.project.BillX.model.DiscountType;
import jakarta.validation.constraints.DecimalMin;
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
public class CreateOrderRequest {

    private Long customerId;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    private DiscountType discountType;

    @DecimalMin(value = "0.0", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount;

    private String orderNote;
}
