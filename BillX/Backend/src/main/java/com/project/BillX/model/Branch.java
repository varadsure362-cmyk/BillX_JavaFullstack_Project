package com.project.BillX.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "branches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String address;

    @Column(name = "working_days", length = 100)
    private String workingDays; // e.g. "Mon,Tue,Wed,Thu,Fri,Sat"

    @Column(name = "razorpay_key_id")
    private String razorpayKeyId;

    @Column(name = "razorpay_key_secret", length = 500)
    private String razorpayKeySecret;

    @Column(name = "razorpay_webhook_secret", length = 500)
    private String razorpayWebhookSecret;

    @Column(name = "razorpay_connected", nullable = false)
    @Builder.Default
    private boolean razorpayConnected = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;
}
