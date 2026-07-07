package com.project.BillX.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundResponse {
    private Long id;
    private Long orderId;
    private String reason;
    private BigDecimal amount;
    private Long processedById;
    private String processedByName;
    private LocalDateTime createdAt;
}
