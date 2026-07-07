package com.project.BillX.serviceimpl;

import com.project.BillX.model.*;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ForbiddenException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.*;
import com.project.BillX.service.OrderService;
import com.project.BillX.util.BranchAccessValidator;
import com.project.BillX.util.PdfReportGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final BranchAccessValidator branchAccessValidator;
    private final PdfReportGenerator pdfReportGenerator;

    public OrderServiceImpl(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository,
                            BranchAccessValidator branchAccessValidator,
                            PdfReportGenerator pdfReportGenerator) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.branchAccessValidator = branchAccessValidator;
        this.pdfReportGenerator = pdfReportGenerator;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Long userId = branchAccessValidator.getCurrentUser().getId();
        User cashier = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));

        if (cashier.getRole() != Role.CASHIER) {
            throw new ForbiddenException("Only Cashiers can create orders");
        }
        if (cashier.getBranch() == null) {
            throw new ForbiddenException("Cashier is not assigned to a branch yet");
        }

        Branch branch = cashier.getBranch();

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Order order = Order.builder()
                .orderNumber("ORD-" + branch.getId() + "-" + System.currentTimeMillis())
                .branch(branch)
                .cashier(cashier)
                .customer(customer)
                .status(OrderStatus.PENDING)
                .orderNote(request.getOrderNote())
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            // Verify product belongs to the branch
            if (!product.getBranch().getId().equals(branch.getId())) {
                throw new BadRequestException("Product '" + product.getName() + "' does not belong to your branch");
            }

            // Check stock availability
            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new BadRequestException("Product '" + product.getName() + "' is out of stock. (Available: " 
                        + product.getStockQuantity() + ", Requested: " + itemReq.getQuantity() + ")");
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            orderItems.add(orderItem);
        }

        order.setSubtotal(subtotal);
        order.setItems(orderItems);

        // Apply discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getDiscountAmount() != null && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && request.getDiscountType() != null) {
            order.setDiscountType(request.getDiscountType());
            order.setDiscountAmount(request.getDiscountAmount());
            if (request.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = subtotal.multiply(request.getDiscountAmount()).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
            } else {
                discountAmount = request.getDiscountAmount();
            }
        }

        // Cap discount so total doesn't become negative
        if (discountAmount.compareTo(subtotal) > 0) {
            discountAmount = subtotal;
        }

        order.setTaxAmount(BigDecimal.ZERO); // default tax amount
        BigDecimal totalAmount = subtotal.subtract(discountAmount);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(Long branchId, Pageable pageable) {
        branchAccessValidator.validateBranchAccess(branchId);
        Page<Order> orders = orderRepository.findByBranchId(branchId, pageable);
        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        branchAccessValidator.validateBranchAccess(order.getBranch().getId());
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getOrderInvoicePdf(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        branchAccessValidator.validateBranchAccess(order.getBranch().getId());
        return pdfReportGenerator.generateInvoicePdf(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        branchAccessValidator.validateBranchAccess(order.getBranch().getId());

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Can only cancel PENDING orders. Current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);
        return mapToOrderResponse(savedOrder);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        if (order == null) return null;
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .branchId(order.getBranch().getId())
                .branchName(order.getBranch().getName())
                .cashierId(order.getCashier().getId())
                .cashierName(order.getCashier().getFullName())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .discountType(order.getDiscountType())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .orderNote(order.getOrderNote())
                .status(order.getStatus())
                .items(order.getItems() != null ? order.getItems().stream().map(this::mapToOrderItemResponse).collect(java.util.stream.Collectors.toList()) : null)
                .createdAt(order.getCreatedAt())
                .build();
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        if (item == null) return null;
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
