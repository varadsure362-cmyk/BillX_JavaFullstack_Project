package com.project.BillX.service;

import com.project.BillX.dto.*;
import com.project.BillX.model.Payment;

public interface PaymentService {
    QrPaymentResponse generateQr(QrPaymentRequest request);
    void processWebhook(String payload, String signature);
    PaymentResponse processCashPayment(CashPaymentRequest request);
    PaymentResponse getPaymentStatusByQrId(String qrId);
    void markPaid(Long orderId, Payment payment);
}
