package com.project.BillX.service;

import com.project.BillX.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(CreateOrderRequest request);
    Page<OrderResponse> getOrders(Long branchId, Pageable pageable);
    OrderResponse getOrderById(Long id);
    byte[] getOrderInvoicePdf(Long id);
    OrderResponse cancelOrder(Long id);
}
