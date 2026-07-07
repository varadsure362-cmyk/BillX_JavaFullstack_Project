package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface RefundService {
    RefundResponse processRefund(RefundRequest request);
    List<RefundResponse> getRefundsByOrderId(Long orderId);
}
