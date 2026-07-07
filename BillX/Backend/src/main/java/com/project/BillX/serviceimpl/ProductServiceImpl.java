package com.project.BillX.serviceimpl;

import com.project.BillX.model.*;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.*;
import com.project.BillX.service.ProductService;
import com.project.BillX.util.BranchAccessValidator;
import com.project.BillX.util.CloudinaryUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AlertRepository alertRepository;
    private final CloudinaryUtil cloudinaryUtil;
    private final BranchAccessValidator branchAccessValidator;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              BranchRepository branchRepository,
                              UserRepository userRepository,
                              InventoryLogRepository inventoryLogRepository,
                              AlertRepository alertRepository,
                              CloudinaryUtil cloudinaryUtil,
                              BranchAccessValidator branchAccessValidator) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.alertRepository = alertRepository;
        this.cloudinaryUtil = cloudinaryUtil;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public ProductResponse createProduct(String name, String sku, Long categoryId, Long branchId,
                                          BigDecimal price, Integer stockQuantity, Integer lowStockThreshold,
                                          MultipartFile image) {
        branchAccessValidator.validateBranchAccess(branchId);

        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Price cannot be negative");
        }
        if (stockQuantity < 0) {
            throw new BadRequestException("Stock quantity cannot be negative");
        }
        if (lowStockThreshold < 0) {
            throw new BadRequestException("Low stock threshold cannot be negative");
        }

        if (productRepository.existsBySku(sku)) {
            throw new ConflictException("Product SKU '" + sku + "' already exists");
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        String imageUrl = cloudinaryUtil.uploadImage(image);

        Product product = Product.builder()
                .name(name)
                .sku(sku)
                .category(category)
                .branch(branch)
                .price(price)
                .stockQuantity(stockQuantity)
                .lowStockThreshold(lowStockThreshold)
                .imageUrl(imageUrl)
                .build();

        Product savedProduct = productRepository.save(product);

        // Audit log for initial inventory
        if (stockQuantity > 0) {
            User currentUser = userRepository.findById(branchAccessValidator.getCurrentUser().getId()).orElse(null);
            InventoryLog log = InventoryLog.builder()
                    .product(savedProduct)
                    .changeType(ChangeType.RESTOCK)
                    .quantityChanged(stockQuantity)
                    .resultingQuantity(stockQuantity)
                    .updatedBy(currentUser)
                    .build();
            inventoryLogRepository.save(log);
        }

        return mapToProductResponse(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(Long branchId, Long categoryId, String search, Pageable pageable) {
        branchAccessValidator.validateBranchAccess(branchId);
        Page<Product> products = productRepository.findProducts(branchId, categoryId, search, pageable);
        return products.map(this::mapToProductResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        branchAccessValidator.validateBranchAccess(product.getBranch().getId());
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, String name, String sku, Long categoryId,
                                          BigDecimal price, Integer stockQuantity, Integer lowStockThreshold,
                                          MultipartFile image) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        branchAccessValidator.validateBranchAccess(product.getBranch().getId());

        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Price cannot be negative");
        }
        if (stockQuantity < 0) {
            throw new BadRequestException("Stock quantity cannot be negative");
        }
        if (lowStockThreshold < 0) {
            throw new BadRequestException("Low stock threshold cannot be negative");
        }

        if (sku != null && !sku.equals(product.getSku()) && productRepository.existsBySku(sku)) {
            throw new ConflictException("Product SKU '" + sku + "' already exists");
        }

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        product.setName(name);
        if (sku != null) product.setSku(sku);
        product.setPrice(price);
        product.setLowStockThreshold(lowStockThreshold);

        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryUtil.uploadImage(image);
            product.setImageUrl(imageUrl);
        }

        // If stockQuantity is directly modified by manager
        int diff = stockQuantity - product.getStockQuantity();
        if (diff != 0) {
            product.setStockQuantity(stockQuantity);
            User currentUser = userRepository.findById(branchAccessValidator.getCurrentUser().getId()).orElse(null);
            InventoryLog log = InventoryLog.builder()
                    .product(product)
                    .changeType(diff > 0 ? ChangeType.RESTOCK : ChangeType.ADJUSTMENT)
                    .quantityChanged(diff)
                    .resultingQuantity(stockQuantity)
                    .updatedBy(currentUser)
                    .build();
            inventoryLogRepository.save(log);
        }

        Product updatedProduct = productRepository.save(product);

        // Check low stock alert
        checkLowStockAlert(updatedProduct);

        return mapToProductResponse(updatedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateInventory(Long id, InventoryUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        branchAccessValidator.validateBranchAccess(product.getBranch().getId());

        ChangeType changeType;
        try {
            changeType = ChangeType.valueOf(request.getChangeType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid change type. Must be RESTOCK or ADJUSTMENT");
        }

        int result = product.getStockQuantity() + request.getQuantityChanged();
        if (result < 0) {
            throw new BadRequestException("Inventory update would result in negative stock");
        }

        product.setStockQuantity(result);
        Product savedProduct = productRepository.save(product);

        User currentUser = userRepository.findById(branchAccessValidator.getCurrentUser().getId()).orElse(null);
        InventoryLog log = InventoryLog.builder()
                .product(savedProduct)
                .changeType(changeType)
                .quantityChanged(request.getQuantityChanged())
                .resultingQuantity(result)
                .updatedBy(currentUser)
                .build();
        inventoryLogRepository.save(log);

        // Check low stock alert
        checkLowStockAlert(savedProduct);

        return mapToProductResponse(savedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        branchAccessValidator.validateBranchAccess(product.getBranch().getId());
        productRepository.delete(product);
    }

    private void checkLowStockAlert(Product product) {
        if (product.getStockQuantity() < product.getLowStockThreshold()) {
            LocalDateTime since = LocalDateTime.now().minusHours(24);
            boolean alreadyAlerted = alertRepository.existsByBranchIdAndTypeAndReferenceIdAndIsReadFalseAndCreatedAtAfter(
                    product.getBranch().getId(),
                    AlertType.LOW_STOCK,
                    product.getId(),
                    since
            );

            if (!alreadyAlerted) {
                Alert alert = Alert.builder()
                        .branch(product.getBranch())
                        .type(AlertType.LOW_STOCK)
                        .message("Product '" + product.getName() + "' (SKU: " + product.getSku() + ") is running low on stock. Current: " + product.getStockQuantity())
                        .referenceId(product.getId())
                        .isRead(false)
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private ProductResponse mapToProductResponse(Product product) {
        if (product == null) return null;
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Uncategorized")
                .branchId(product.getBranch().getId())
                .branchName(product.getBranch().getName())
                .build();
    }
}
