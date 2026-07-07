package com.project.BillX.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayConnectResponse {
    private boolean connected;
    private String webhookSecret;
}
