package com.project.BillX.repository;

import com.project.BillX.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    List<Refund> findByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Refund r WHERE r.order.branch.id = :branchId")
    BigDecimal getTotalRefundsByBranch(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Refund r WHERE r.order.branch.id = :branchId AND r.createdAt >= :since")
    BigDecimal sumRefundsSince(@Param("branchId") Long branchId, @Param("since") LocalDateTime since);
}
