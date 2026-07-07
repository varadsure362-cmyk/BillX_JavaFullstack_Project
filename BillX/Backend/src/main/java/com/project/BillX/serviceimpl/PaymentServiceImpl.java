package com.project.BillX.serviceimpl;

import com.project.BillX.model.*;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ConflictException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.*;
import com.project.BillX.service.PaymentService;
import com.project.BillX.util.BranchAccessValidator;
import com.project.BillX.util.EncryptionUtil;
import com.project.BillX.util.RazorpayClientResolver;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AlertRepository alertRepository;
    private final RazorpayClientResolver razorpayClientResolver;
    private final EncryptionUtil encryptionUtil;
    private final BranchAccessValidator branchAccessValidator;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository,
                              ProductRepository productRepository,
                              InventoryLogRepository inventoryLogRepository,
                              AlertRepository alertRepository,
                              RazorpayClientResolver razorpayClientResolver,
                              EncryptionUtil encryptionUtil,
                              BranchAccessValidator branchAccessValidator) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.alertRepository = alertRepository;
        this.razorpayClientResolver = razorpayClientResolver;
        this.encryptionUtil = encryptionUtil;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public QrPaymentResponse generateQr(QrPaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        branchAccessValidator.validateBranchAccess(order.getBranch().getId());

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Order is already paid or cancelled. Status: " + order.getStatus());
        }

        // Resolve branch-specific Razorpay Client. If not connected, throws BusinessException.
        RazorpayClient branchClient = razorpayClientResolver.resolveClientForBranch(order.getBranch().getId());

        int amountInPaise = order.getTotalAmount().multiply(new BigDecimal(100)).intValue();
        String qrImageUrl;
        String qrId;
        String rzpOrderId;

        try {
            // Create Razorpay Order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_order_" + order.getId());
            com.razorpay.Order rzpOrder = branchClient.orders.create(orderRequest);
            rzpOrderId = rzpOrder.get("id");

            // Create Dynamic UPI QR Code
            JSONObject qrRequest = new JSONObject();
            qrRequest.put("type", "upi_qr");
            qrRequest.put("name", "BillX POS Branch " + order.getBranch().getId());
            qrRequest.put("usage", "single_use");
            qrRequest.put("fixed_amount", true);
            qrRequest.put("payment_amount", amountInPaise);
            qrRequest.put("description", "Payment for order " + order.getOrderNumber());
            JSONObject notes = new JSONObject();
            notes.put("order_id", order.getId().toString());
            qrRequest.put("notes", notes);

            com.razorpay.QrCode qrCode = branchClient.qrCode.create(qrRequest);
            qrImageUrl = qrCode.get("image_url");
            qrId = qrCode.get("id");

        } catch (Exception e) {
            log.error("Failed to call Razorpay APIs, falling back to dummy checkout flow", e);
            // Fallback checkout logic
            qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=billx@upi&pn=BillX&am=" + order.getTotalAmount() + "&cu=INR";
            qrId = "qr_dummy_" + System.currentTimeMillis();
            rzpOrderId = "rzp_order_dummy_" + System.currentTimeMillis();
        }

        // Persist PENDING payment row
        Payment payment = Payment.builder()
                .order(order)
                .method(PaymentMethod.UPI)
                .amount(order.getTotalAmount())
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(qrId) // map qrId here
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);

        return QrPaymentResponse.builder()
                .qrImageUrl(qrImageUrl)
                .qrId(qrId)
                .razorpayOrderId(rzpOrderId)
                .build();
    }

    @Override
    @Transactional
    public void processWebhook(String payload, String signature) {
        log.info("Processing Razorpay webhook payload: {}", payload);

        // a. Parse the payload to extract razorpay_order_id (don't trust it yet)
        String rzpOrderId;
        try {
            JSONObject json = new JSONObject(payload);
            JSONObject jsonPayload = json.getJSONObject("payload");
            JSONObject paymentObj = jsonPayload.getJSONObject("payment");
            JSONObject entityObj = paymentObj.getJSONObject("entity");
            rzpOrderId = entityObj.getString("order_id");
        } catch (Exception e) {
            log.error("Failed to parse razorpay_order_id from webhook payload", e);
            throw new BadRequestException("Invalid webhook payload structure: " + e.getMessage());
        }

        // b. Look up the payments row and its order's branchId from that
        Payment paymentRecord = paymentRepository.findByRazorpayOrderId(rzpOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for Razorpay Order ID: " + rzpOrderId));

        Branch branch = paymentRecord.getOrder().getBranch();

        // c. Fetch and decrypt THAT branch's razorpayWebhookSecret
        if (!branch.isRazorpayConnected() || branch.getRazorpayWebhookSecret() == null) {
            throw new BadRequestException("Razorpay is not connected for branch: " + branch.getId());
        }
        String decryptedWebhookSecret = encryptionUtil.decrypt(branch.getRazorpayWebhookSecret());

        // d. Verify the X-Razorpay-Signature header against the payload using that specific secret
        // e. Reject with 400 if invalid
        try {
            boolean sigOk = Utils.verifyWebhookSignature(payload, signature, decryptedWebhookSecret);
            if (!sigOk) {
                throw new BadRequestException("Invalid Razorpay webhook signature");
            }
        } catch (Exception e) {
            log.error("Webhook signature verification failed", e);
            throw new BadRequestException("Webhook signature verification failed: " + e.getMessage());
        }

        // f. Keep all existing idempotency logic (dedupe by razorpay_payment_id) unchanged
        JSONObject json = new JSONObject(payload);
        String event = json.getString("event");

        if ("payment.captured".equals(event)) {
            JSONObject paymentEntity = json.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
            String rzpPaymentId = paymentEntity.getString("id");

            // Idempotency check: look up if payment with success exists
            Optional<Payment> existingPayment = paymentRepository.findByRazorpayPaymentId(rzpPaymentId);
            if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.SUCCESS) {
                log.info("Webhook event already processed (idempotent). Payment ID: {}", rzpPaymentId);
                return;
            }

            paymentRecord.setRazorpayPaymentId(rzpPaymentId);
            paymentRecord.setStatus(PaymentStatus.SUCCESS);

            // g. On payment.captured, proceed with the existing markPaid flow (order -> PAID, stock decrement, inventory log)
            markPaid(paymentRecord.getOrder().getId(), paymentRecord);
        } else if ("payment.failed".equals(event)) {
            paymentRecord.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(paymentRecord);
        }
    }

    @Override
    @Transactional
    public PaymentResponse processCashPayment(CashPaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        branchAccessValidator.validateBranchAccess(order.getBranch().getId());

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Order is already paid or cancelled. Status: " + order.getStatus());
        }

        if (request.getAmountReceived().compareTo(order.getTotalAmount()) < 0) {
            throw new BadRequestException("Amount received (INR " + request.getAmountReceived() + ") is less than order total (INR " + order.getTotalAmount() + ")");
        }

        Payment payment = Payment.builder()
                .order(order)
                .method(PaymentMethod.CASH)
                .amount(order.getTotalAmount())
                .status(PaymentStatus.SUCCESS)
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        markPaid(order.getId(), savedPayment);

        return mapToPaymentResponse(savedPayment);
    }

    @Override
    @Transactional
    public PaymentResponse getPaymentStatusByQrId(String qrId) {
        Payment payment = paymentRepository.findByRazorpayPaymentId(qrId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with QR ID: " + qrId));

        // If the payment is still PENDING locally, sync with Razorpay's API (handles localhost webhook issues)
        if (payment.getStatus() == PaymentStatus.PENDING && 
            payment.getRazorpayOrderId() != null && 
            !payment.getRazorpayOrderId().startsWith("rzp_order_dummy_")) {
            try {
                RazorpayClient branchClient = razorpayClientResolver.resolveClientForBranch(payment.getOrder().getBranch().getId());
                List<com.razorpay.Payment> rzpPayments = branchClient.orders.fetchPayments(payment.getRazorpayOrderId());
                for (com.razorpay.Payment rzpPayment : rzpPayments) {
                    String status = rzpPayment.get("status");
                    if ("captured".equals(status)) {
                        log.info("Found captured payment in Razorpay for Order: {}. Syncing local status.", payment.getRazorpayOrderId());
                        payment.setRazorpayPaymentId(rzpPayment.get("id"));
                        markPaid(payment.getOrder().getId(), payment);
                        break;
                    } else if ("failed".equals(status)) {
                        payment.setStatus(PaymentStatus.FAILED);
                        paymentRepository.save(payment);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to sync status with Razorpay for Order: {}", payment.getRazorpayOrderId(), e);
            }
        }

        branchAccessValidator.validateBranchAccess(payment.getOrder().getBranch().getId());
        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional
    public void markPaid(Long orderId, Payment payment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.PAID) {
            log.info("Order {} is already marked as PAID.", order.getId());
            return;
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // Decrement stock transactionally
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int newStock = product.getStockQuantity() - item.getQuantity();
            if (newStock < 0) {
                throw new ConflictException("Insufficient stock for product: " + product.getName());
            }
            product.setStockQuantity(newStock);
            productRepository.save(product);

            // Log sale
            InventoryLog logEntry = InventoryLog.builder()
                    .product(product)
                    .changeType(ChangeType.SALE)
                    .quantityChanged(-item.getQuantity())
                    .resultingQuantity(newStock)
                    .build();
            inventoryLogRepository.save(logEntry);

            // Low Stock check
            checkLowStockAlert(product, newStock);
        }
    }

    private void checkLowStockAlert(Product product, int newStock) {
        if (newStock < product.getLowStockThreshold()) {
            LocalDateTime since = LocalDateTime.now().minusHours(24);
            boolean alreadyAlerted = alertRepository.existsByBranchIdAndTypeAndReferenceIdAndIsReadFalseAndCreatedAtAfter(
                    product.getBranch().getId(),
                    AlertType.LOW_STOCK,
                    product.getId(),
                    since
            );

            if (!alreadyAlerted) {
                Alert alert = Alert.builder()
                        .branch(product.getBranch())
                        .type(AlertType.LOW_STOCK)
                        .message("Product '" + product.getName() + "' (SKU: " + product.getSku() + ") is running low on stock. Current: " + newStock)
                        .referenceId(product.getId())
                        .isRead(false)
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        if (payment == null) return null;
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .method(payment.getMethod())
                .amount(payment.getAmount())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
