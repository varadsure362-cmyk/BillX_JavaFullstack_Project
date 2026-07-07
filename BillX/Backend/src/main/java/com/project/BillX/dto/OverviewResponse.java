package com.project.BillX.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverviewResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private BigDecimal totalRefunds;
    private BigDecimal averageOrderValue;
}
