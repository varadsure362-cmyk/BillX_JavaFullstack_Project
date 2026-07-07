package com.project.BillX.repository;

import com.project.BillX.model.Order;
import com.project.BillX.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByBranchId(Long branchId, Pageable pageable);
    List<Order> findByBranchIdAndCreatedAtAfter(Long branchId, LocalDateTime dateTime);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.branch.id = :branchId AND o.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED)")
    BigDecimal getTotalRevenueByBranch(@Param("branchId") Long branchId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.branch.id = :branchId")
    Long getOrderCountByBranch(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(AVG(o.totalAmount), 0) FROM Order o WHERE o.branch.id = :branchId AND o.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED)")
    BigDecimal getAverageOrderValueByBranch(@Param("branchId") Long branchId);

    // Sales Trend query (Daily)
    @Query("SELECT FUNCTION('DATE', o.createdAt) as dateLabel, SUM(o.totalAmount) as salesValue " +
           "FROM Order o WHERE o.branch.id = :branchId AND o.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED) " +
           "AND o.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE', o.createdAt) " +
           "ORDER BY FUNCTION('DATE', o.createdAt) ASC")
    List<Object[]> getSalesTrendDaily(@Param("branchId") Long branchId, @Param("startDate") LocalDateTime startDate);

    // Cashier performance
    @Query("SELECT o.cashier.fullName as cashierName, SUM(o.totalAmount) as salesValue, COUNT(o) as orderCount " +
           "FROM Order o WHERE o.branch.id = :branchId AND o.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED) " +
           "GROUP BY o.cashier.id, o.cashier.fullName " +
           "ORDER BY salesValue DESC")
    List<Object[]> getCashierPerformance(@Param("branchId") Long branchId);
}
