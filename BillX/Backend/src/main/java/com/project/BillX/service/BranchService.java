package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface BranchService {
    BranchResponse createBranch(CreateBranchRequest request);
    List<BranchResponse> getAllBranches();
    BranchResponse getBranchById(Long id);
    BranchResponse updateBranch(Long id, CreateBranchRequest request);
    void deleteBranch(Long id);
    RazorpayConnectResponse connectRazorpay(Long id, RazorpayConnectRequest request);
    RazorpayStatusResponse getRazorpayStatus(Long id);
}
