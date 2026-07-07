package com.project.BillX.repository;

import com.project.BillX.model.Alert;
import com.project.BillX.model.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByBranchIdAndIsReadFalse(Long branchId);
    List<Alert> findByBranchId(Long branchId);
    List<Alert> findByBranchIdAndType(Long branchId, AlertType type);

    boolean existsByBranchIdAndTypeAndReferenceIdAndIsReadFalseAndCreatedAtAfter(
            Long branchId, AlertType type, Long referenceId, LocalDateTime since);
}
