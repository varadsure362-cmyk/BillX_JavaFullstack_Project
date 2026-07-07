package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/qr")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<QrPaymentResponse>> generateQr(@Valid @RequestBody QrPaymentRequest request) {
        QrPaymentResponse response = paymentService.generateQr(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Razorpay UPI QR code generated successfully"));
    }

    @PostMapping("/cash")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processCashPayment(@Valid @RequestBody CashPaymentRequest request) {
        PaymentResponse response = paymentService.processCashPayment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cash payment processed successfully"));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        paymentService.processWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{qrId}")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(@PathVariable String qrId) {
        PaymentResponse response = paymentService.getPaymentStatusByQrId(qrId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment status retrieved successfully"));
    }
}
