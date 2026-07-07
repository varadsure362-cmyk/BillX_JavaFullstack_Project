package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerRequest request);
    List<CustomerResponse> getCustomers(Long branchId);
    CustomerResponse getCustomerById(Long id);
    CustomerResponse getCustomerByPhone(String phone);
    CustomerResponse updateCustomer(Long id, CustomerRequest request);
}
