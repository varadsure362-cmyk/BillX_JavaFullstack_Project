package com.project.BillX.util;

import com.project.BillX.model.Branch;
import com.project.BillX.exception.BusinessException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.BranchRepository;
import com.razorpay.RazorpayClient;
import org.springframework.stereotype.Service;

@Service
public class RazorpayClientResolver {

    private final BranchRepository branchRepository;
    private final EncryptionUtil encryptionUtil;

    public RazorpayClientResolver(BranchRepository branchRepository, EncryptionUtil encryptionUtil) {
        this.branchRepository = branchRepository;
        this.encryptionUtil = encryptionUtil;
    }

    public RazorpayClient resolveClientForBranch(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        if (!branch.isRazorpayConnected() || branch.getRazorpayKeyId() == null || branch.getRazorpayKeySecret() == null) {
            throw new BusinessException("Razorpay is not connected for this branch. Please set up Razorpay or use Cash payment instead.");
        }

        String decryptedSecret = encryptionUtil.decrypt(branch.getRazorpayKeySecret());
        try {
            return new RazorpayClient(branch.getRazorpayKeyId(), decryptedSecret);
        } catch (Exception e) {
            throw new BusinessException("Failed to initialize Razorpay client: " + e.getMessage());
        }
    }
}
