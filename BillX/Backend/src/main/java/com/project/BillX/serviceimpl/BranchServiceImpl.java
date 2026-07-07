package com.project.BillX.serviceimpl;

import com.project.BillX.model.Branch;
import com.project.BillX.model.User;
import com.project.BillX.dto.*;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.repository.UserRepository;
import com.project.BillX.service.BranchService;
import com.project.BillX.util.BranchAccessValidator;
import com.project.BillX.util.EncryptionUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BranchAccessValidator branchAccessValidator;
    private final EncryptionUtil encryptionUtil;

    public BranchServiceImpl(BranchRepository branchRepository,
                             UserRepository userRepository,
                             BranchAccessValidator branchAccessValidator,
                             EncryptionUtil encryptionUtil) {
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.branchAccessValidator = branchAccessValidator;
        this.encryptionUtil = encryptionUtil;
    }

    @Override
    @Transactional
    public BranchResponse createBranch(CreateBranchRequest request) {
        Branch branch = Branch.builder()
                .name(request.getName())
                .address(request.getAddress())
                .workingDays(request.getWorkingDays())
                .build();

        Branch savedBranch = branchRepository.save(branch);

        // Auto-assign the creating manager to this branch
        Long managerId = branchAccessValidator.getCurrentUser().getId();
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        manager.getManagedBranches().add(savedBranch);
        userRepository.save(manager);

        return mapToBranchResponse(savedBranch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getAllBranches() {
        Long managerId = branchAccessValidator.getCurrentUser().getId();
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        return manager.getManagedBranches().stream()
                .map(this::mapToBranchResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BranchResponse getBranchById(Long id) {
        branchAccessValidator.validateBranchAccess(id);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        return mapToBranchResponse(branch);
    }

    @Override
    @Transactional
    public BranchResponse updateBranch(Long id, CreateBranchRequest request) {
        branchAccessValidator.validateBranchAccess(id);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        branch.setName(request.getName());
        branch.setAddress(request.getAddress());
        branch.setWorkingDays(request.getWorkingDays());

        Branch updatedBranch = branchRepository.save(branch);
        return mapToBranchResponse(updatedBranch);
    }

    @Override
    @Transactional
    public void deleteBranch(Long id) {
        branchAccessValidator.validateBranchAccess(id);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        // Dissociate from managers who manage this branch
        List<User> managers = userRepository.findManagersManagingBranch(id);
        for (User manager : managers) {
            manager.getManagedBranches().remove(branch);
            userRepository.save(manager);
        }

        // Dissociate cashiers assigned to this branch
        List<User> cashiers = userRepository.findAllByBranchId(id);
        for (User cashier : cashiers) {
            cashier.setBranch(null);
            userRepository.save(cashier);
        }

        branchRepository.delete(branch);
    }

    @Override
    @Transactional
    public RazorpayConnectResponse connectRazorpay(Long id, RazorpayConnectRequest request) {
        branchAccessValidator.validateBranchAccess(id);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));

        String encryptedSecret = encryptionUtil.encrypt(request.getKeySecret());
        String generatedWebhookSecret = java.util.UUID.randomUUID().toString().replace("-", "");
        String encryptedWebhookSecret = encryptionUtil.encrypt(generatedWebhookSecret);

        branch.setRazorpayKeyId(request.getKeyId());
        branch.setRazorpayKeySecret(encryptedSecret);
        branch.setRazorpayWebhookSecret(encryptedWebhookSecret);
        branch.setRazorpayConnected(true);

        branchRepository.save(branch);

        return RazorpayConnectResponse.builder()
                .connected(true)
                .webhookSecret(generatedWebhookSecret)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RazorpayStatusResponse getRazorpayStatus(Long id) {
        branchAccessValidator.validateBranchAccess(id);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));

        return RazorpayStatusResponse.builder()
                .connected(branch.isRazorpayConnected())
                .build();
    }

    private BranchResponse mapToBranchResponse(Branch branch) {
        if (branch == null) return null;
        return BranchResponse.builder()
                .id(branch.getId())
                .name(branch.getName())
                .address(branch.getAddress())
                .workingDays(branch.getWorkingDays())
                .createdAt(branch.getCreatedAt())
                .build();
    }
}
