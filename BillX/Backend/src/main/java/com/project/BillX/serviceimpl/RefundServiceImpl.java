package com.project.BillX.serviceimpl;

import com.project.BillX.model.*;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.*;
import com.project.BillX.service.RefundService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final BranchAccessValidator branchAccessValidator;

    public RefundServiceImpl(RefundRepository refundRepository,
                             OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             ProductRepository productRepository,
                             InventoryLogRepository inventoryLogRepository,
                             AlertRepository alertRepository,
                             UserRepository userRepository,
                             BranchAccessValidator branchAccessValidator) {
        this.refundRepository = refundRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public RefundResponse processRefund(RefundRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Cashier can only refund own branch orders
        branchAccessValidator.validateBranchAccess(order.getBranch().getId());

        Long cashierId = branchAccessValidator.getCurrentUser().getId();
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));

        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.PARTIALLY_REFUNDED) {
            throw new ConflictException("Order must be PAID or PARTIALLY_REFUNDED to process refund. Status: " + order.getStatus());
        }

        // Calculate remaining refundable amount
        BigDecimal alreadyRefunded = refundRepository.findByOrderId(order.getId()).stream()
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingRefundable = order.getTotalAmount().subtract(alreadyRefunded);
        if (request.getAmount().compareTo(remainingRefundable) > 0) {
            throw new BadRequestException("Refund amount (INR " + request.getAmount() + ") exceeds remaining refundable amount (INR " + remainingRefundable + ")");
        }

        // Process restock of items
        for (Long itemId : request.getItemIds()) {
            OrderItem item = orderItemRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found with ID: " + itemId));

            if (!item.getOrder().getId().equals(order.getId())) {
                throw new BadRequestException("Order item does not belong to order: " + order.getId());
            }

            Product product = item.getProduct();
            int newStock = product.getStockQuantity() + item.getQuantity();
            product.setStockQuantity(newStock);
            productRepository.save(product);

            // Audit inventory log
            InventoryLog logEntry = InventoryLog.builder()
                    .product(product)
                    .changeType(ChangeType.ADJUSTMENT)
                    .quantityChanged(item.getQuantity())
                    .resultingQuantity(newStock)
                    .updatedBy(cashier)
                    .build();
            inventoryLogRepository.save(logEntry);
        }

        Refund refund = Refund.builder()
                .order(order)
                .reason(request.getReason())
                .amount(request.getAmount())
                .processedBy(cashier)
                .build();

        Refund savedRefund = refundRepository.save(refund);

        // Update Order Status
        BigDecimal totalRefunded = alreadyRefunded.add(request.getAmount());
        if (totalRefunded.compareTo(order.getTotalAmount()) >= 0) {
            order.setStatus(OrderStatus.REFUNDED);
        } else {
            order.setStatus(OrderStatus.PARTIALLY_REFUNDED);
        }
        orderRepository.save(order);

        // Refund Spike Alert check (rolling 24h > INR 5000)
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        BigDecimal rolling24hRefunds = refundRepository.sumRefundsSince(order.getBranch().getId(), since);

        if (rolling24hRefunds.compareTo(BigDecimal.valueOf(5000)) > 0) {
            boolean alreadySpiked = alertRepository.existsByBranchIdAndTypeAndReferenceIdAndIsReadFalseAndCreatedAtAfter(
                    order.getBranch().getId(),
                    AlertType.REFUND_SPIKE,
                    order.getId(),
                    since
            );

            if (!alreadySpiked) {
                Alert alert = Alert.builder()
                        .branch(order.getBranch())
                        .type(AlertType.REFUND_SPIKE)
                        .message("Refund spike alert! Cumulative refunds on branch '" + order.getBranch().getName() 
                                + "' in the last 24 hours reached INR " + rolling24hRefunds)
                        .referenceId(order.getId())
                        .isRead(false)
                        .build();
                alertRepository.save(alert);
            }
        }

        return mapToRefundResponse(savedRefund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsByOrderId(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        branchAccessValidator.validateBranchAccess(order.getBranch().getId());
        return refundRepository.findByOrderId(orderId).stream()
                .map(this::mapToRefundResponse)
                .collect(Collectors.toList());
    }

    private RefundResponse mapToRefundResponse(Refund refund) {
        if (refund == null) return null;
        return RefundResponse.builder()
                .id(refund.getId())
                .orderId(refund.getOrder().getId())
                .reason(refund.getReason())
                .amount(refund.getAmount())
                .processedById(refund.getProcessedBy().getId())
                .processedByName(refund.getProcessedBy().getFullName())
                .createdAt(refund.getCreatedAt())
                .build();
    }
}
