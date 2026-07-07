package com.project.BillX.repository;

import com.project.BillX.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi.product.name as name, SUM(oi.lineTotal) as totalSales, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi WHERE oi.order.branch.id = :branchId AND oi.order.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED) " +
           "GROUP BY oi.product.id, oi.product.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> getTopProducts(@Param("branchId") Long branchId, Pageable pageable);

    @Query("SELECT COALESCE(oi.product.category.name, 'Uncategorized') as categoryName, SUM(oi.lineTotal) as totalSales, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi WHERE oi.order.branch.id = :branchId AND oi.order.status IN (com.project.BillX.model.OrderStatus.PAID, com.project.BillX.model.OrderStatus.PARTIALLY_REFUNDED) " +
           "GROUP BY oi.product.category.id, oi.product.category.name")
    List<Object[]> getSalesByCategory(@Param("branchId") Long branchId);
}
