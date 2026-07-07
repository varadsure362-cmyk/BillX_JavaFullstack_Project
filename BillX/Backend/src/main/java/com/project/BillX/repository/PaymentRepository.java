package com.project.BillX.repository;

import com.project.BillX.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    @Query("SELECT p.method as method, SUM(p.amount) as totalAmount, COUNT(p) as paymentCount " +
           "FROM Payment p WHERE p.order.branch.id = :branchId AND p.status = com.project.BillX.model.PaymentStatus.SUCCESS " +
           "GROUP BY p.method")
    List<Object[]> getPaymentBreakdown(@Param("branchId") Long branchId);
}
