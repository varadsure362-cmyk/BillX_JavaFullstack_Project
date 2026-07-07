package com.project.BillX.dto;

import com.project.BillX.model.DiscountType;
import com.project.BillX.model.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long branchId;
    private String branchName;
    private Long cashierId;
    private String cashierName;
    private Long customerId;
    private String customerName;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private DiscountType discountType;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String orderNote;
    private OrderStatus status;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}
