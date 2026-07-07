package com.project.BillX.serviceimpl;

import com.project.BillX.model.Branch;
import com.project.BillX.model.Customer;
import com.project.BillX.model.Role;
import com.project.BillX.model.User;
import com.project.BillX.dto.*;
import com.project.BillX.exception.BadRequestException;
import com.project.BillX.exception.ForbiddenException;
import com.project.BillX.exception.ResourceNotFoundException;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.repository.CustomerRepository;
import com.project.BillX.repository.UserRepository;
import com.project.BillX.security.UserPrincipal;
import com.project.BillX.service.CustomerService;
import com.project.BillX.util.BranchAccessValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BranchAccessValidator branchAccessValidator;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               BranchRepository branchRepository,
                               UserRepository userRepository,
                               BranchAccessValidator branchAccessValidator) {
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.branchAccessValidator = branchAccessValidator;
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        Long branchId = request.getBranchId();
        UserPrincipal currentUser = branchAccessValidator.getCurrentUser();

        if (branchId == null) {
            if (Role.CASHIER.name().equals(currentUser.getRole())) {
                branchId = currentUser.getBranchId();
            } else {
                throw new BadRequestException("Branch ID is required for managers to create customer");
            }
        }

        branchAccessValidator.validateBranchAccess(branchId);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .branch(branch)
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        return mapToCustomerResponse(savedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getCustomers(Long branchId) {
        UserPrincipal currentUser = branchAccessValidator.getCurrentUser();

        if (branchId == null) {
            if (Role.CASHIER.name().equals(currentUser.getRole())) {
                branchId = currentUser.getBranchId();
            } else {
                // Return all customers for manager's branches
                User manager = userRepository.findById(currentUser.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
                return manager.getManagedBranches().stream()
                        .flatMap(b -> customerRepository.findByBranchId(b.getId()).stream())
                        .map(this::mapToCustomerResponse)
                        .collect(Collectors.toList());
            }
        }

        branchAccessValidator.validateBranchAccess(branchId);
        return customerRepository.findByBranchId(branchId).stream()
                .map(this::mapToCustomerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (customer.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(customer.getBranch().getId());
        }
        return mapToCustomerResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with phone: " + phone));
        if (customer.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(customer.getBranch().getId());
        }
        return mapToCustomerResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (customer.getBranch() != null) {
            branchAccessValidator.validateBranchAccess(customer.getBranch().getId());
        }

        if (request.getBranchId() != null) {
            branchAccessValidator.validateBranchAccess(request.getBranchId());
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
            customer.setBranch(branch);
        }

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());

        Customer updatedCustomer = customerRepository.save(customer);
        return mapToCustomerResponse(updatedCustomer);
    }

    private CustomerResponse mapToCustomerResponse(Customer customer) {
        if (customer == null) return null;
        return CustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .branchId(customer.getBranch() != null ? customer.getBranch().getId() : null)
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
