package com.project.BillX.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayConnectRequest {

    @NotBlank(message = "Key ID is required")
    private String keyId;

    @NotBlank(message = "Key Secret is required")
    private String keySecret;
}
