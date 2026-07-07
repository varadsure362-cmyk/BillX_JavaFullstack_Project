package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam("branchId") Long branchId,
            @RequestParam("price") BigDecimal price,
            @RequestParam("stockQuantity") Integer stockQuantity,
            @RequestParam("lowStockThreshold") Integer lowStockThreshold,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        ProductResponse response = productService.createProduct(name, sku, categoryId, branchId, price, stockQuantity, lowStockThreshold, image);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Product created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @RequestParam("branchId") Long branchId,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        // Enforce max page size 100
        int pageSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<ProductResponse> response = productService.getProducts(branchId, categoryId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.fromPage(response), "Products retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Product retrieved successfully"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam("price") BigDecimal price,
            @RequestParam("stockQuantity") Integer stockQuantity,
            @RequestParam("lowStockThreshold") Integer lowStockThreshold,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        ProductResponse response = productService.updateProduct(id, name, sku, categoryId, price, stockQuantity, lowStockThreshold, image);
        return ResponseEntity.ok(ApiResponse.success(response, "Product updated successfully"));
    }

    @PutMapping("/{id}/inventory")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody InventoryUpdateRequest request) {
        ProductResponse response = productService.updateInventory(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }
}
