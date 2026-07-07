package com.project.BillX.repository;

import com.project.BillX.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByBranchId(Long branchId);
    List<Category> findByBranchIsNull();
    List<Category> findByBranchIdOrBranchIsNull(Long branchId);
    Optional<Category> findByNameAndBranchId(String name, Long branchId);
    Optional<Category> findByNameAndBranchIsNull(String name);
}
