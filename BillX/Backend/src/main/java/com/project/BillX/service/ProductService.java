package com.project.BillX.service;

import com.project.BillX.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

public interface ProductService {
    ProductResponse createProduct(String name, String sku, Long categoryId, Long branchId,
                                  BigDecimal price, Integer stockQuantity, Integer lowStockThreshold,
                                  MultipartFile image);
    Page<ProductResponse> getProducts(Long branchId, Long categoryId, String search, Pageable pageable);
    ProductResponse getProductById(Long id);
    ProductResponse updateProduct(Long id, String name, String sku, Long categoryId,
                                  BigDecimal price, Integer stockQuantity, Integer lowStockThreshold,
                                  MultipartFile image);
    ProductResponse updateInventory(Long id, InventoryUpdateRequest request);
    void deleteProduct(Long id);
}
