package com.project.BillX.controller;

import com.project.BillX.dto.*;
import com.project.BillX.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Customer registered successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getCustomers(@RequestParam(required = false) Long branchId) {
        List<CustomerResponse> response = customerService.getCustomers(branchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Customers retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer retrieved successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerByPhone(@RequestParam String phone) {
        CustomerResponse response = customerService.getCustomerByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(@PathVariable Long id,
                                                                        @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer profile updated successfully"));
    }
}
