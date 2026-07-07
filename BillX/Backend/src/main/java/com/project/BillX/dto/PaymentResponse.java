package com.project.BillX.dto;

import com.project.BillX.model.PaymentMethod;
import com.project.BillX.model.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private PaymentMethod method;
    private BigDecimal amount;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
