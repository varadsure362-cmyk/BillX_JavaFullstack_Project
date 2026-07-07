package com.project.BillX.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrPaymentResponse {
    private String qrImageUrl;
    private String qrId; // Razorpay QR ID
    private String razorpayOrderId;
}
