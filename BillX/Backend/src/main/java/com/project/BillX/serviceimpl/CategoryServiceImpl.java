package com.project.BillX.serviceimpl;

import com.project.BillX.model.Branch;
import com.project.BillX.model.Category;
import com.project.BillX.dto.*;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.repository.CategoryRepository;
import com.project.BillX.repository.ProductRepository;
import com.project.BillX.service.CategoryService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final BranchAccessValidator branchAccessValidator;

    public CategoryServiceImpl(CategoryRepository categoryRepository,
                               BranchRepository branchRepository,
                               ProductRepository productRepository,
                               BranchAccessValidator branchAccessValidator) {
        this.categoryRepository = categoryRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (request.getBranchId() != null) {
            branchAccessValidator.validateBranchAccess(request.getBranchId());
        }

        // Duplicate check
        boolean exists = request.getBranchId() == null ?
                categoryRepository.findByNameAndBranchIsNull(request.getName()).isPresent() :
                categoryRepository.findByNameAndBranchId(request.getName(), request.getBranchId()).isPresent();

        if (exists) {
            throw new ConflictException("Category with name '" + request.getName() + "' already exists");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        }

        Category category = Category.builder()
                .name(request.getName())
                .branch(branch)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToCategoryResponse(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(Long branchId) {
        if (branchId != null) {
            branchAccessValidator.validateBranchAccess(branchId);
            return categoryRepository.findByBranchIdOrBranchIsNull(branchId).stream()
                    .map(this::mapToCategoryResponse)
                    .collect(Collectors.toList());
        }
        return categoryRepository.findByBranchIsNull().stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (category.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(category.getBranch().getId());
        }

        boolean exists = request.getBranchId() == null ?
                categoryRepository.findByNameAndBranchIsNull(request.getName()).filter(c -> !c.getId().equals(id)).isPresent() :
                categoryRepository.findByNameAndBranchId(request.getName(), request.getBranchId()).filter(c -> !c.getId().equals(id)).isPresent();

        if (exists) {
            throw new ConflictException("Category with name '" + request.getName() + "' already exists");
        }

        category.setName(request.getName());
        Category updatedCategory = categoryRepository.save(category);
        return mapToCategoryResponse(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (category.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(category.getBranch().getId());
        }

        if (productRepository.existsByCategoryId(id)) {
            throw new ConflictException("Cannot delete category because it contains products. Reassign the products first.");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        if (category == null) return null;
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .branchId(category.getBranch() != null ? category.getBranch().getId() : null)
                .branchName(category.getBranch() != null ? category.getBranch().getName() : null)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
