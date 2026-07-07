package com.project.BillX.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private BigDecimal price;
    private String imageUrl;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private Long categoryId;
    private String categoryName;
    private Long branchId;
    private String branchName;
}
